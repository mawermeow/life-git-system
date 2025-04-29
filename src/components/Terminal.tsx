import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '../hooks/useGameState';

export const Terminal: React.FC = () => {
  const {
    state,
    commandHistory,
    currentCommand,
    setCurrentCommand,
    executeCommand,
    isLoading,
  } = useGameState();

  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        setCurrentCommand(commandHistory[commandHistory.length - 1]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentCommand('');
    }
  };

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentCommand(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  return (
    <div className="w-full h-screen bg-black text-green-400 font-mono p-4 terminal">
      <div
        ref={terminalRef}
        className="h-[calc(100%-2rem)] overflow-y-auto mb-4"
      >
        {state.logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {log}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center text-green-400">
            <span className="animate-pulse">思考中</span>
            <span className="ml-2">...</span>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <span className="text-green-400 mr-2">$</span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-green-400 outline-none w-full"
            autoFocus
            disabled={isLoading}
          />
          {showCursor && !isLoading && (
            <span
              className="absolute top-0 h-5 w-0.5 bg-green-400 cursor"
              style={{
                left: `${cursorPosition * 0.6}rem`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}; 