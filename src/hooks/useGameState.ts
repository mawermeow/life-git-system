import { useState, useCallback } from 'react';
import { GameState, CommandResult } from '../types/game';
import { CommandParser } from '../utils/commandParser';
import { StoryGenerator } from '../utils/storyGenerator';

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

  const executeCommand = useCallback(async (input: string) => {
    const parsed = CommandParser.parse(input);
    if (!parsed) {
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, '錯誤：無效的指令格式，請使用 git 指令'],
      }));
      return;
    }

    const { command, args } = parsed;
    const result = CommandParser.executeCommand(command, args, state);

    setCommandHistory(prev => [...prev, input]);
    setCurrentCommand('');

    if (result.newState) {
      setState(result.newState);
      
      // 如果是 commit 指令，生成故事
      if (command === 'commit') {
        setIsLoading(true);
        try {
          const currentBranch = result.newState.branches.find(
            b => b.name === result.newState.currentBranch
          );
          if (currentBranch && currentBranch.commits.length > 0) {
            const latestCommit = currentBranch.commits[0];
            const story = await StoryGenerator.getStoryForCommit(latestCommit, {
              branches: result.newState.branches,
              currentBranch: result.newState.currentBranch,
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

    setState(prev => ({
      ...prev,
      logs: [...prev.logs, result.message],
    }));
  }, [state]);

  return {
    state,
    commandHistory,
    currentCommand,
    setCurrentCommand,
    executeCommand,
    isLoading,
  };
}; 