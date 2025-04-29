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
}

export interface GameState {
  branches: Branch[];
  currentBranch: string;
  head: string; // 當前 commit ID
  logs: string[];
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