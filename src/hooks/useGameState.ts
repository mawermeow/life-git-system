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

    // 檢查第一次提交
    if (!newAchievements[0].unlocked && newState.branches[0].commits.length > 1) {
      newAchievements[0].unlocked = true;
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, '🎉 成就解鎖：第一次選擇！'],
      }));
    }

    // 檢查分支大師
    if (!newAchievements[1].unlocked && newState.branches.length >= 3) {
      newAchievements[1].unlocked = true;
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, '🎉 成就解鎖：分支大師！'],
      }));
    }

    // 檢查倖存者成就
    const currentBranch = newState.branches.find(b => b.name === newState.currentBranch);
    if (currentBranch?.name === 'dangerous' && !newAchievements[3].unlocked) {
      newAchievements[3].unlocked = true;
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, '🎉 成就解鎖：倖存者！'],
      }));
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

    setState(prev => ({
      ...prev,
      logs: [...prev.logs, result.message, ''],
    }));

    if (result.newState) {
      const newState = {
        ...state,
        ...result.newState,
      };
      setState(prev => ({
        ...prev,
        ...result.newState,
      }));
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