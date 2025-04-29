import { useState, useCallback } from 'react';
import { GameState } from '../types/game';
import { CommandParser } from '../utils/commandParser';
import { StoryGenerator } from '../utils/storyGenerator';

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  branch: string;
}

const initialAchievements: Achievement[] = [
  {
    id: 'first_commit',
    title: '第一次選擇',
    description: '完成第一次人生選擇',
    unlocked: false,
    branch: 'main',
  },
  {
    id: 'branch_master',
    title: '分支大師',
    description: '創建 3 個不同的分支',
    unlocked: false,
    branch: 'main',
  },
  {
    id: 'time_traveler',
    title: '時空旅人',
    description: '使用 reset 回到過去',
    unlocked: false,
    branch: 'main',
  },
  {
    id: 'survivor',
    title: '倖存者',
    description: '在危險的分支中存活下來',
    unlocked: false,
    branch: 'dangerous',
  },
  {
    id: 'explorer',
    title: '探索者',
    description: '探索所有可能的分支',
    unlocked: false,
    branch: 'main',
  },
];

const initialState: GameState = {
  branches: [
    {
      name: 'main',
      currentCommitId: 'initial',
      commits: [
        {
          id: 'initial',
          message: '人生開始',
          timestamp: Date.now(),
          parentIds: [],
        },
      ],
      description: '這是你的主線人生，充滿無限可能',
      options: ['學習新技能', '開始新工作', '建立新關係'],
      achievements: ['first_commit', 'branch_master', 'time_traveler', 'explorer'],
    },
  ],
  currentBranch: 'main',
  head: 'initial',
  logs: [
    '歡迎來到人生 Git 系統！',
    '',
    '這是一個使用 Git 指令來操控人生的文字遊戲。',
    '每個 Git 指令都會影響你的人生走向，創造不同的分支和結局。',
    '',
    '可用的指令：',
    '  git status        - 查看當前人生狀態',
    '  git commit -m "訊息" - 記錄人生選擇',
    '  git branch 名稱   - 建立新的人生分支',
    '  git checkout 名稱 - 切換到不同的人生分支',
    '  git switch -c 名稱 - 建立並切換到新分支',
    '  git merge 名稱    - 合併不同的人生選擇',
    '  git rebase        - 重新設定人生基底',
    '  git reset --hard HEAD~1 - 回到上一個選擇',
    '  git log           - 查看人生歷程',
    '  git push          - 推送人生變更',
    '',
    '輸入指令開始你的人生旅程吧！',
    '',
  ],
  bannedBranches: [],
  achievements: initialAchievements,
};

export const useGameState = () => {
  const [state, setState] = useState<GameState>(initialState);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [finalGoals, setFinalGoals] = useState(2);

  const checkAchievements = useCallback((newState: GameState) => {
    const newAchievements = [...newState.achievements];

    // 第一次選擇：main 分支至少有 2 個 commit
    if (!newAchievements[0].unlocked) {
      const mainBranch = newState.branches.find(b => b.name === 'main');
      if (mainBranch && mainBranch.commits.length > 1) {
        newAchievements[0].unlocked = true;
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, '🎉 成就解鎖：第一次選擇！'],
        }));
      }
    }

    // 分支大師：不同分支至少有 1 次 commit
    if (!newAchievements[1].unlocked) {
      const hasEnoughBranchCommits = newState.branches.filter(b => b.commits.length > 1).length >= 3;
      if (hasEnoughBranchCommits) {
        newAchievements[1].unlocked = true;
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, '🎉 成就解鎖：分支大師！'],
        }));
      }
    }

    // 時空旅人：使用 reset 指令
    if (!newAchievements[2].unlocked) {
      const usedReset = newState.logs.some(log => log.includes('⏳ 回到上一個人生選擇！'));
      if (usedReset) {
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, '🎉 成就解鎖：時空旅人！'],
        }));
        newAchievements[2].unlocked = true;
      }
    }

    // 倖存者：在 dangerous 分支提交兩次且未死亡
    if (!newAchievements[3].unlocked) {
      const dangerousBranch = newState.branches.find(b => b.name === 'dangerous');
      if (dangerousBranch && dangerousBranch.commits.length >= 3) {
        newAchievements[3].unlocked = true;
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, '🎉 成就解鎖：倖存者！'],
        }));
      }
    }

    // 探索者：checkout 過至少 5 個不同分支
    if (!newAchievements[4].unlocked) {
      const checkoutLogs = newState.logs.filter(log => log.includes('checkout'));
      const checkedOutBranches = new Set(checkoutLogs.map(log => {
        const match = log.match(/checkout\s+(\w+)/);
        return match?.[1];
      }).filter(Boolean));
      if (checkedOutBranches.size >= 5) {
        newAchievements[4].unlocked = true;
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, '🎉 成就解鎖：探索者！'],
        }));
      }
    }

    setState(prev => ({
      ...prev,
      achievements: newAchievements,
    }));
  }, []);

  const checkFinalGoals = useCallback((newState: GameState) => {
    const activeBranches = newState.branches.length;
    const deaths = newState.bannedBranches.length;

    // 最終目標數量：2 + (分支數 / 2)，每死亡3次扣1個目標，最少1個
    const calculatedGoals = Math.max(1, 2 + Math.floor(activeBranches / 2) - Math.floor(deaths / 3));
    setFinalGoals(calculatedGoals);

    const unlockedAchievements = newState.achievements.filter(a => a.unlocked).length;
    if (unlockedAchievements >= calculatedGoals) {
      setState({
        ...initialState,
        logs: [
          ...newState.logs,
          '',
          '🎯 恭喜你達成所有人生目標！重啟新人生旅程。',
          '',
        ],
        bannedBranches: [], // 清空死亡禁令
      });
    }
  }, []);

  const handleDeath = useCallback((branchName: string) => {
    setState(prev => {
      const newBranches = prev.branches.filter(b => b.name !== branchName);
      return {
        ...prev,
        branches: newBranches,
        currentBranch: 'main',
        bannedBranches: [...prev.bannedBranches, branchName],
        logs: [
          ...prev.logs,
          `⚠️ 警告：在分支「${branchName}」中發生了意外！`,
          '系統已自動將你送回主線人生。',
          `分支「${branchName}」已被永久禁止。`,
          '',
        ],
      };
    });
  }, []);

  const executeCommand = useCallback(async (input: string) => {
    if (!input.trim()) return;

    setState(prev => ({
      ...prev,
      logs: [...prev.logs, `$ ${input}`],
    }));

    const parsed = CommandParser.parse(input);
    if (!parsed) {
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, '錯誤：無效的指令格式，請使用 git 指令', ''],
      }));
      return;
    }

    const { command, args } = parsed;
    const result = CommandParser.executeCommand(command, args, state);

    setCommandHistory(prev => [...prev, input]);
    setCurrentCommand('');

    // 依據指令類型調整訊息
    let feedbackMessage = result.message;
    if (result.success) {
      switch (command) {
        case 'branch': {
          if (args.length > 0) {
            const branchName = args[0];
            const branchThemes = {
              career: ['職場', '工作', '事業', '創業'],
              study: ['學習', '進修', '研究', '讀書'],
              relationship: ['感情', '友情', '親情', '人際'],
              travel: ['旅行', '冒險', '探索', '流浪'],
              health: ['健康', '運動', '養生', '健身'],
              art: ['藝術', '創作', '音樂', '繪畫'],
              default: ['未知', '神秘', '新奇', '特別']
            };

            // 根據分支名稱判斷主題
            let theme = 'default';
            for (const [key, words] of Object.entries(branchThemes)) {
              if (words.some(word => branchName.includes(word))) {
                theme = key;
                break;
              }
            }

            const themeResponses = {
              career: [
                `✨ 你決定開創新的職場道路：${branchName}`,
                `✨ 在 ${branchName} 這條職場路上，充滿了機遇與挑戰`,
                `✨ 你踏上了 ${branchName} 的職業旅程`
              ],
              study: [
                `📚 你開始了 ${branchName} 的學習之旅`,
                `📚 在知識的海洋中，你選擇了 ${branchName} 的方向`,
                `📚 ${branchName} 的學習之路，將帶給你新的視野`
              ],
              relationship: [
                `💝 你開啟了 ${branchName} 的情感篇章`,
                `💝 在 ${branchName} 的關係中，你將經歷成長與改變`,
                `💝 你選擇探索 ${branchName} 的人際關係`
              ],
              travel: [
                `🌍 你踏上了 ${branchName} 的冒險之旅`,
                `🌍 在 ${branchName} 的旅程中，你將發現新的世界`,
                `🌍 你選擇了 ${branchName} 的探索之路`
              ],
              health: [
                `💪 你開始了 ${branchName} 的健康計劃`,
                `💪 在 ${branchName} 的道路上，你將變得更強壯`,
                `💪 你選擇了 ${branchName} 的生活方式`
              ],
              art: [
                `🎨 你開啟了 ${branchName} 的創作之旅`,
                `🎨 在 ${branchName} 的藝術世界中，你將展現才華`,
                `🎨 你選擇了 ${branchName} 的創意道路`
              ],
              default: [
                `✨ 你開啟了 ${branchName} 的新篇章`,
                `✨ 在 ${branchName} 的道路上，充滿了未知與可能`,
                `✨ 你選擇了 ${branchName} 的探索之路`
              ]
            };

            const responses = themeResponses[theme as keyof typeof themeResponses];
            feedbackMessage = responses[Math.floor(Math.random() * responses.length)];
          } else {
            feedbackMessage = result.message;
          }
          break;
        }
        case 'checkout': {
          const branchName = args[0];
          const branch = state.branches.find(b => b.name === branchName);
          const checkoutResponses = [
            `🔀 你回到了 ${branchName} 的道路上`,
            `🔀 你切換到了 ${branchName} 的人生軌跡`,
            `🔀 你重新踏上了 ${branchName} 的旅程`
          ];
          feedbackMessage = `${checkoutResponses[Math.floor(Math.random() * checkoutResponses.length)]}\n${branch?.description || '這是一個全新的開始！'}`;
          break;
        }
        case 'switchBranch': {
          const branchName = args[1];
          const branch = state.branches.find(b => b.name === branchName);
          const switchResponses = [
            `✨ 你開創了 ${branchName} 的新道路`,
            `✨ 你踏上了 ${branchName} 的探索之旅`,
            `✨ 你選擇了 ${branchName} 的人生方向`
          ];
          feedbackMessage = `${switchResponses[Math.floor(Math.random() * switchResponses.length)]}\n${branch?.description || '這是一個全新的開始！'}`;
          break;
        }
        case 'commit': {
          const commitMessage = args.join(' ').replace(/^-m\s*"?(.+?)"?$/, '$1') || '';
          if (commitMessage) {
            const commitResponses = [
              `📝 記錄了這個時刻：「${commitMessage}」`,
              `📝 將這個變更保存下來：「${commitMessage}」`,
              `📝 更新了人生日誌：「${commitMessage}」`
            ];
            feedbackMessage = commitResponses[Math.floor(Math.random() * commitResponses.length)];
          } else if (result.message) {
            feedbackMessage = result.message;
          }
          break;
        }
        case 'merge': {
          const branchName = args[0];
          const mergeResponses = [
            `🤝 你將 ${branchName} 的經歷融入了當前的人生`,
            `🤝 你整合了 ${branchName} 的經驗與教訓`,
            `🤝 你將 ${branchName} 的收穫帶入了現在的生活`
          ];
          feedbackMessage = mergeResponses[Math.floor(Math.random() * mergeResponses.length)];
          break;
        }
        case 'reset': {
          const resetResponses = [
            '⏳ 你決定回到上一個人生選擇點',
            '⏳ 你選擇重新思考這個決定',
            '⏳ 你回到了人生的上一個十字路口'
          ];
          feedbackMessage = resetResponses[Math.floor(Math.random() * resetResponses.length)];
          break;
        }
        default:
          feedbackMessage = result.message;
      }
    }

    if (result.newState) {
      const newState = {
        ...state,
        ...result.newState,
        logs: [...state.logs, `$ ${input}`, feedbackMessage, ''],
      };
      setState(newState);
      checkAchievements(newState);
      checkFinalGoals(newState);

      // 檢查是否觸發死亡事件
      if (command === 'commit') {
        const currentBranch = newState.branches.find(b => b.name === newState.currentBranch);
        if (currentBranch?.name.includes('dangerous')) {
          const deathChance = Math.random();
          if (deathChance < 0.3) {
            handleDeath(currentBranch.name);
          }
        }
      }

      // 如果是 commit 指令，生成故事
      if (command === 'commit') {
        setIsLoading(true);
        try {
          const currentBranch = newState.branches.find(
            b => b.name === newState.currentBranch
          );
          if (currentBranch && currentBranch.commits.length > 0) {
            const latestCommit = currentBranch.commits[0];
            const story = await StoryGenerator.getStoryForCommit(latestCommit, {
              branches: newState.branches,
              currentBranch: newState.currentBranch,
            });

            setState(prev => ({
              ...prev,
              logs: [...prev.logs, '', story, ''],
            }));
          }
        } catch (error) {
          console.error('生成故事失敗:', error);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, `$ ${input}`, feedbackMessage, ''],
      }));
    }
  }, [state, checkAchievements, checkFinalGoals, handleDeath]);

  return {
    state,
    executeCommand,
    currentCommand,
    setCurrentCommand,
    isLoading,
    commandHistory,
    achievements: state.achievements,
  };
};