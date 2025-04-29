import { GitCommand, CommandResult, GameState, Branch } from '../types/game';

// 對外顯示的指令列表
const displayCommands = ['status', 'commit', 'branch', 'checkout', 'switch', 'merge', 'rebase', 'reset', 'log', 'push'] as const;

// 內部使用的指令列表（包含 switchBranch）
const validCommands = [...displayCommands, 'switchBranch'] as const;

// 內建指令列表
const builtinCommands = ['clear', 'echo', 'help', 'life', 'fortune', 'matrix'] as const;

function isValidCommand(command: string): command is typeof validCommands[number] {
  return (validCommands as readonly string[]).includes(command);
}

function isBuiltinCommand(command: string): command is typeof builtinCommands[number] {
  return (builtinCommands as readonly string[]).includes(command);
}

export class CommandParser {
  static parse(input: string): { command: GitCommand | typeof builtinCommands[number]; args: string[] } | null {
    const parts = input.trim().split(' ');
    if (parts[0] !== 'git') {
      // 檢查是否為內建指令
      if (isBuiltinCommand(parts[0])) {
        return { command: parts[0], args: parts.slice(1) };
      }
      return null;
    }

    let commandStr = parts[1];
    const args = parts.slice(2);

    // 特別處理 git switch -c 指令，轉換成 switchBranch
    if (commandStr === 'switch' && args[0] === '-c') {
      commandStr = 'switchBranch';
    }

    if (!isValidCommand(commandStr)) {
      return null;
    }

    return { command: commandStr as GitCommand, args };
  }

  static executeCommand(
    command: GitCommand | typeof builtinCommands[number],
    args: string[],
    state: GameState
  ): CommandResult {
    // 處理內建指令
    if (isBuiltinCommand(command)) {
      switch (command) {
        case 'clear':
          return {
            success: true,
            message: '',
            newState: {
              ...state,
              logs: [],
            },
          };
        case 'echo':
          return {
            success: true,
            message: args.join(' '),
          };
        case 'help':
          return {
            success: true,
            message: `
可用的 Git 指令：
  git status        - 查看當前人生狀態
  git commit -m "訊息" - 記錄人生選擇
  git branch 名稱   - 建立新的人生分支
  git checkout 名稱 - 切換到不同的人生分支
  git switch -c 名稱 - 建立並切換到新分支
  git merge 名稱    - 合併不同的人生選擇
  git rebase        - 重新設定人生基底
  git reset --hard HEAD~1 - 回到上一個選擇
  git log           - 查看人生歷程
  git push          - 推送人生變更

內建指令：
  clear            - 清空終端機
  echo 訊息        - 顯示訊息
  help             - 顯示幫助
  life             - 顯示人生格言
  fortune          - 顯示今日運勢
  matrix           - 進入矩陣世界
            `,
          };
        case 'life': {
          const lifeQuotes = [
            '人生就像 Git，每個選擇都是一個分支',
            '有時候，最好的選擇是 reset --hard',
            '人生沒有 merge conflict，只有不同的選擇',
            '每個 commit 都是人生的一個里程碑',
            '不要害怕創建新分支，那是探索的機會',
          ];
          return {
            success: true,
            message: lifeQuotes[Math.floor(Math.random() * lifeQuotes.length)],
          };
        }
        case 'fortune': {
          const fortunes = [
            '今天適合創建新分支，探索未知',
            '小心危險的分支，可能會遇到意外',
            '是時候合併一些分支了，整合你的選擇',
            '今天運勢不錯，可以大膽嘗試新事物',
            '建議先備份當前分支，以防萬一',
          ];
          return {
            success: true,
            message: fortunes[Math.floor(Math.random() * fortunes.length)],
          };
        }
        case 'matrix': {
          const matrixChars = '01';
          let matrixMessage = '';
          for (let i = 0; i < 10; i++) {
            let line = '';
            for (let j = 0; j < 50; j++) {
              line += matrixChars[Math.floor(Math.random() * matrixChars.length)];
            }
            matrixMessage += line + '\n';
          }
          return {
            success: true,
            message: matrixMessage,
          };
        }
      }
    }

    // 原有的 Git 指令處理
    switch (command) {
      case 'status':
        return this.handleStatus(state);
      case 'commit':
        return this.handleCommit(args, state);
      case 'branch':
        return this.handleBranch(args, state);
      case 'checkout':
        return this.handleCheckout(args, state);
      case 'switch':
      case 'switchBranch':
        return this.handleSwitch(args, state);
      case 'merge':
        return this.handleMerge(args, state);
      case 'rebase':
        return this.handleRebase(state);
      case 'reset':
        return this.handleReset(args, state);
      case 'log':
        return this.handleLog(state);
      case 'push':
        return this.handlePush(state);
      default:
        return {
          success: false,
          message: '未知的指令',
        };
    }
  }

  private static handleStatus(state: GameState): CommandResult {
    const currentBranch = state.branches.find(b => b.name === state.currentBranch);
    return {
      success: true,
      message: `目前位於分支 ${state.currentBranch}\n最新提交: ${currentBranch?.commits[0]?.message || '無'}`,
    };
  }

  private static handleCommit(args: string[], state: GameState): CommandResult {
    if (args[0] !== '-m' || !args[1]) {
      return {
        success: false,
        message: '請使用 git commit -m "訊息" 格式',
      };
    }

    const message = args[1].replace(/"/g, '');
    const newCommit = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
      parentIds: [state.head],
      description: message,
      options: [],
    };

    const newState = {
      ...state,
      head: newCommit.id,
      branches: state.branches.map(branch => {
        if (branch.name === state.currentBranch) {
          return {
            ...branch,
            commits: [newCommit, ...branch.commits],
            currentCommitId: newCommit.id,
          };
        }
        return branch;
      }),
    };

    return {
      success: true,
      message: `[${state.currentBranch}] ${newCommit.id.slice(0, 7)} ${message}`,
      newState,
    };
  }

  private static handleBranch(args: string[], state: GameState): CommandResult {
    if (!state.branches || state.branches.length === 0) {
      return {
        success: false,
        message: '目前沒有任何分支',
      };
    }

    if (args.length === 0) {
      return {
        success: true,
        message: state.branches.map(b =>
          b.name === state.currentBranch ? `* ${b.name}` : `  ${b.name}`
        ).join('\n'),
      };
    }

    const branchName = args[0];
    if (state.branches.some(b => b.name === branchName)) {
      return {
        success: false,
        message: `分支 ${branchName} 已存在`,
      };
    }

    const currentBranch = state.branches.find(b => b.name === state.currentBranch);
    if (!currentBranch) {
      return {
        success: false,
        message: '找不到當前分支',
      };
    }

    const newBranch: Branch = {
      name: branchName,
      currentCommitId: currentBranch.currentCommitId,
      commits: [...currentBranch.commits],
      description: `這是 ${branchName} 分支，充滿未知的挑戰和機遇`,
      options: ['繼續探索', '回到主線', '尋找新機會'],
      achievements: [],
    };

    return {
      success: true,
      message: `已建立新分支 ${branchName}`,
      newState: {
        ...state,
        branches: [...state.branches, newBranch],
      },
    };
  }

  private static handleCheckout(args: string[], state: GameState): CommandResult {
    const branchName = args[0];
    if (!state.branches.some(b => b.name === branchName)) {
      return {
        success: false,
        message: `分支 ${branchName} 不存在`,
      };
    }

    return {
      success: true,
      message: `已切換到分支 ${branchName}`,
      newState: {
        ...state,
        currentBranch: branchName,
      },
    };
  }

  private static handleSwitch(args: string[], state: GameState): CommandResult {
    if (args[0] !== '-c' || !args[1]) {
      return {
        success: false,
        message: '請使用 git switch -c 分支名稱 格式',
      };
    }

    const branchName = args[1];
    if (state.branches.some(b => b.name === branchName)) {
      return {
        success: false,
        message: `分支 ${branchName} 已存在`,
      };
    }

    const currentBranch = state.branches.find(b => b.name === state.currentBranch);
    if (!currentBranch) {
      return {
        success: false,
        message: '找不到當前分支',
      };
    }

    const newBranch: Branch = {
      name: branchName,
      currentCommitId: currentBranch.currentCommitId,
      commits: [...currentBranch.commits],
      description: `這是 ${branchName} 分支，充滿未知的挑戰和機遇`,
      options: ['繼續探索', '回到主線', '尋找新機會'],
      achievements: [],
    };

    return {
      success: true,
      message: `已建立並切換到新分支 ${branchName}`,
      newState: {
        ...state,
        currentBranch: branchName,
        branches: [...state.branches, newBranch],
      },
    };
  }

  private static handleMerge(args: string[], state: GameState): CommandResult {
    const branchName = args[0];
    const targetBranch = state.branches.find(b => b.name === branchName);
    if (!targetBranch) {
      return {
        success: false,
        message: `分支 ${branchName} 不存在`,
      };
    }

    return {
      success: true,
      message: `正在合併 ${branchName} 到 ${state.currentBranch}...\n請解決衝突後提交`,
      newState: state,
    };
  }

  private static handleRebase(state: GameState): CommandResult {
    return {
      success: true,
      message: '正在重新設定基底...\n請解決衝突後提交',
      newState: state,
    };
  }

  private static handleReset(args: string[], state: GameState): CommandResult {
    if (args[0] !== '--hard' || args[1] !== 'HEAD~1') {
      return {
        success: false,
        message: '不支援的 reset 參數',
      };
    }

    const currentBranch = state.branches.find(b => b.name === state.currentBranch);
    if (!currentBranch || currentBranch.commits.length < 2) {
      return {
        success: false,
        message: '無法重置，沒有足夠的提交',
      };
    }

    const newState = {
      ...state,
      head: currentBranch.commits[1].id,
      branches: state.branches.map(branch => {
        if (branch.name === state.currentBranch) {
          return {
            ...branch,
            commits: branch.commits.slice(1),
            currentCommitId: branch.commits[1].id,
          };
        }
        return branch;
      }),
    };

    return {
      success: true,
      message: '已重置到上一個提交',
      newState,
    };
  }

  private static handleLog(state: GameState): CommandResult {
    const currentBranch = state.branches.find(b => b.name === state.currentBranch);
    if (!currentBranch) {
      return {
        success: false,
        message: '找不到當前分支',
      };
    }

    const logMessages = currentBranch.commits.map(commit =>
      `commit ${commit.id.slice(0, 7)}\nAuthor: 你 <you@life.com>\nDate: ${new Date(commit.timestamp).toLocaleString()}\n\n    ${commit.message}\n`
    );

    return {
      success: true,
      message: logMessages.join('\n'),
    };
  }

  private static handlePush(state: GameState): CommandResult {
    return {
      success: true,
      message: '已將變更推送到人生遠端',
      newState: state,
    };
  }

  static getCommandSuggestions(input: string): string[] {
    const parts = input.trim().split(' ');
    if (parts.length === 1) {
      // 如果只輸入了一個單詞，同時顯示 Git 指令和內建指令
      const currentInput = parts[0];
      const gitCommands = currentInput === 'git' ? displayCommands : [];
      const builtinSuggestions = builtinCommands.filter(cmd =>
        cmd.startsWith(currentInput) && cmd !== currentInput
      );
      return [...gitCommands, ...builtinSuggestions];
    } else if (parts[0] === 'git') {
      const currentInput = parts[1] || '';
      return displayCommands.filter(cmd =>
        cmd.startsWith(currentInput) && cmd !== currentInput
      );
    }
    return [];
  }

  static getCommandArgsSuggestions(command: GitCommand, currentArgs: string[]): string[] {
    switch (command) {
      case 'commit':
        return currentArgs.length === 0 ? ['-m'] : [];
      case 'switch':
        return currentArgs.length === 0 ? ['-c'] : [];
      case 'reset':
        return currentArgs.length === 0 ? ['--hard'] : [];
      default:
        return [];
    }
  }
}