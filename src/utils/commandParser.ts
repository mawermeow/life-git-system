import { GitCommand, CommandResult, GameState, Branch } from '../types/game';

const validCommands = ['status', 'commit', 'branch', 'checkout', 'switch', 'switchBranch', 'merge', 'rebase', 'reset', 'log', 'push'] as const;

function isValidCommand(command: string): command is typeof validCommands[number] {
  return (validCommands as readonly string[]).includes(command);
}

export class CommandParser {
  static parse(input: string): { command: GitCommand; args: string[] } | null {
    const parts = input.trim().split(' ');
    if (parts[0] !== 'git') return null;

    let commandStr = parts[1];
    const args = parts.slice(2);

    // 特別處理 git switch -c 指令，轉換成 switchBranch
    if (commandStr === 'switch' && args[0] === '-c') {
      commandStr = 'switchBranch';
      // 不再移除 -c 參數
    }

    if (!isValidCommand(commandStr)) {
      return null;
    }

    return { command: commandStr as GitCommand, args };
  }

  static executeCommand(
    command: GitCommand,
    args: string[],
    state: GameState
  ): CommandResult {
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
    console.log({args,state})
    if (!state.branches || state.branches.length === 0) {
      return {
        success: false,
        message: '目前沒有任何分支',
      };
    }

    if (args.length === 0) {
      console.log("meow")
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
    if (parts[0] !== 'git') return [];

    const currentInput = parts[1] || '';
    return validCommands.filter(cmd => 
      cmd.startsWith(currentInput) && cmd !== currentInput
    );
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