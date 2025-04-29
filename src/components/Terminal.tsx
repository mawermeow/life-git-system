import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { CommandParser } from '../utils/commandParser';

export const Terminal: React.FC = () => {
  const {
    state,
    commandHistory,
    currentCommand,
    setCurrentCommand,
    executeCommand,
    isLoading,
    achievements,
  } = useGameState();

  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // 游標閃爍效果
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 自動滾動到底部
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [state.logs]);

  // 處理 Tab 鍵自動補全
  const handleTabComplete = () => {
    const parts = currentCommand.trim().split(' ');
    if (parts[0] !== 'git') return;

    if (parts.length === 2) {
      // 補全指令
      const commandSuggestions = CommandParser.getCommandSuggestions(currentCommand);
      if (commandSuggestions.length > 0) {
        const selectedSuggestion = commandSuggestions[selectedSuggestionIndex];
        setCurrentCommand(`git ${selectedSuggestion}`);
        setSelectedSuggestionIndex(0);
        setSuggestions([]);
      }
    } else if (parts.length > 2) {
      // 補全參數
      const command = parts[1] as any;
      const currentArgs = parts.slice(2);
      const argSuggestions = CommandParser.getCommandArgsSuggestions(command, currentArgs);
      
      if (argSuggestions.length > 0) {
        const selectedSuggestion = argSuggestions[selectedSuggestionIndex];
        setCurrentCommand(`git ${command} ${selectedSuggestion}`);
        setSelectedSuggestionIndex(0);
        setSuggestions([]);
      }
    }
  };

  // 更新建議列表
  useEffect(() => {
    const parts = currentCommand.trim().split(' ');
    if (parts[0] !== 'git') {
      setSuggestions([]);
      return;
    }

    if (parts.length === 2) {
      setSuggestions(CommandParser.getCommandSuggestions(currentCommand));
    } else if (parts.length > 2) {
      const command = parts[1] as any;
      const currentArgs = parts.slice(2);
      setSuggestions(CommandParser.getCommandArgsSuggestions(command, currentArgs));
    } else {
      setSuggestions([]);
    }
  }, [currentCommand]);

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
      setCurrentCommand('');
      setCursorPosition(0);
      setSuggestions([]);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabComplete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        setCurrentCommand(commandHistory[commandHistory.length - 1]);
        setCursorPosition(commandHistory[commandHistory.length - 1].length);
        setSuggestions([]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentCommand('');
      setCursorPosition(0);
      setSuggestions([]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // 左右移動時即時更新 cursorPosition
      requestAnimationFrame(() => {
        if (inputRef.current) {
          setCursorPosition(inputRef.current.selectionStart || 0);
        }
      });
    }
  };

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrentCommand(newValue);
    setCursorPosition(e.target.selectionStart || newValue.length);
  };

  return (
    <div
      className="relative w-terminal h-terminal bg-[#1e1e1e] text-[#f0f0f0] font-mono rounded-lg overflow-hidden shadow-xl"
      onClick={(e) => {
        // 如果點擊區塊內含有 'achievement-item' class，不進行 focus
        if ((e.target as HTMLElement).closest('.achievement-item')) return;
        inputRef.current?.focus();
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-6 bg-[#2d2d2d] flex items-center px-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="flex-1 text-center text-xs text-[#8a8a8a]">
          人生 Git 系統
        </div>
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="text-xs text-[#8a8a8a] hover:text-[#f0f0f0]"
        >
          {showAchievements ? '隱藏成就' : '顯示成就'}
        </button>
      </div>

      <div className="p-4 pt-6 pb-4 h-[calc(100%-2.5rem)] flex flex-col">
        <motion.div
          ref={terminalRef}
          className="overflow-y-auto flex-1 w-full mb-4"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.3}}
        >
          <AnimatePresence>
            {state.logs.map((log, index) => (
              <motion.div
                key={index}
                className="whitespace-pre-wrap break-words"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              className="flex items-center text-[#8a8a8a]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                儲存中
              </motion.span>
              <motion.span
                className="ml-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              >
                ...
              </motion.span>
            </motion.div>
          )}
        </motion.div>

        {showAchievements && (
          <motion.div
            className="w-full mb-4 p-4 bg-[#2d2d2d] rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3 className="text-lg font-bold mb-2">成就</h3>
            <div className="space-y-2">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`achievement-item flex items-center p-2 rounded ${
                    achievement.unlocked ? 'bg-[#27c93f]/20' : 'bg-[#2d2d2d]'
                  }`}
                >
                  <span className="mr-2">
                    {achievement.unlocked ? '🎉' : '🔒'}
                  </span>
                  <div>
                    <div className="font-bold">{achievement.title}</div>
                    <div className="text-sm text-[#8a8a8a]">
                      {achievement.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 輸入區域 */}
        <motion.div
          className="flex items-center px-2 py-1 w-full bg-[#2d2d2d] rounded"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-[#8a8a8a] mr-2 mt-0.5">$</span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSelect={(e) => {
                const target = e.target as HTMLInputElement;
                setCursorPosition(target.selectionStart || 0);
              }}
              className="bg-transparent text-[#f0f0f0] outline-none w-full text-base tracking-wide border-none focus:border-none focus:ring-0"
              autoFocus
              disabled={isLoading}
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#2d2d2d] rounded shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={`px-2 py-1 cursor-pointer ${
                      index === selectedSuggestionIndex ? 'bg-[#3d3d3d]' : ''
                    }`}
                    onClick={() => {
                      const parts = currentCommand.trim().split(' ');
                      if (parts.length === 2) {
                        setCurrentCommand(`git ${suggestion}`);
                      } else if (parts.length > 2) {
                        setCurrentCommand(`git ${parts[1]} ${suggestion}`);
                      }
                      setSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};