export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  parentIds: string[];
}

export interface Branch {
  name: string;
  currentCommitId: string;
  commits: Commit[];
  description: string; // 分支描述
  options: string[]; // 分支可選項
  achievements: string[]; // 該分支可達成的成就
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  branch: string; // 所屬分支
}

export interface GameState {
  branches: Branch[];
  currentBranch: string;
  head: string; // 當前 commit ID
  logs: string[];
  bannedBranches: string[]; // 被禁止的分支名稱
  achievements: Achievement[];
}

export type GitCommand = 
  | 'status'
  | 'commit'
  | 'branch'
  | 'checkout'
  | 'merge'
  | 'rebase'
  | 'reset'
  | 'log'
  | 'push';

export interface CommandResult {
  success: boolean;
  message: string;
  newState?: GameState;
} 