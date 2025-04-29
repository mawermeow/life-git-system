import { useState, useCallback } from 'react';
import { GameState } from '../types/game';
import { CommandParser } from '../utils/commandParser';
import { StoryGenerator } from '../utils/storyGenerator';

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

const initialAchievements: Achievement[] = [
  {
    id: 'first_commit',
    title: '第一次選擇',
    description: '完成第一次人生選擇',
    unlocked: false,
  },
  {
    id: 'branch_master',
    title: '分支大師',
    description: '創建 3 個不同的分支',
    unlocked: false,
  },
  {
    id: 'time_traveler',
    title: '時空旅人',
    description: '使用 reset 回到過去',
    unlocked: false,
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
};

export const useGameState = () => {
  const [state, setState] = useState<GameState>(initialState);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);

  const checkAchievements = useCallback((newState: GameState) => {
    const newAchievements = [...achievements];

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

    setAchievements(newAchievements);
  }, [achievements]);

  const executeCommand = useCallback(async (input: string) => {
    if (!input.trim()) return;

    // 先顯示用戶輸入的指令
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

    // 顯示命令執行結果
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
  }, [state, checkAchievements]);

  return {
    state,
    commandHistory,
    currentCommand,
    setCurrentCommand,
    executeCommand,
    isLoading,
    achievements,
  };
};