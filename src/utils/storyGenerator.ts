import { Commit, Branch } from '../types/game';

interface StoryContext {
  currentBranch: string;
  currentCommit: Commit;
  branches: Branch[];
}

export class StoryGenerator {
  private static async generateStory(context: StoryContext): Promise<string> {
    const { currentBranch, currentCommit, branches } = context;
    const branchNames = branches.map(b => b.name).join(', ');
    
    const prompt = this.buildPrompt(context);
    try {
      // 這裡可以整合 AI 生成更豐富的故事
      return this.getFallbackStory(context);
    } catch (error) {
      console.error('生成故事失敗:', error);
      return this.getFallbackStory(context);
    }
  }

  private static buildPrompt(context: StoryContext): string {
    const { currentBranch, currentCommit, branches } = context;
    const branchNames = branches.map(b => b.name).join(', ');
    
    return `你正在經歷一個人生選擇。當前分支是「${currentBranch}」，你剛剛做了以下選擇：「${currentCommit.message}」。
    
    你的人生分支有：${branchNames}。
    
    請用幽默且富有哲學意味的方式，描述這個選擇對你人生的影響。保持簡潔，不要超過 100 字。`;
  }

  private static getFallbackStory(context: StoryContext): string {
    const { currentCommit, currentBranch } = context;
    const stories = [
      `在「${currentBranch}」的道路上，你選擇了「${currentCommit.message}」。這個決定像一顆石子投入平靜的湖面，激起層層漣漪，影響著你未來的每一步。`,
      `「${currentCommit.message}」——這不僅僅是一個選擇，更是一個承諾。在「${currentBranch}」的旅程中，你將為這個決定付出代價，也將收穫成長。`,
      `人生就像一本書，在「${currentBranch}」這一章，你寫下了「${currentCommit.message}」。這個選擇將如何影響故事的走向？只有時間能給出答案。`,
      `站在「${currentBranch}」的十字路口，你選擇了「${currentCommit.message}」。這個決定或許微不足道，卻可能改變你的人生軌跡。`,
      `「${currentCommit.message}」——在「${currentBranch}」的旅程中，這是一個重要的里程碑。它標誌著你選擇了這條路，也意味著放棄了其他可能性。`
    ];
    
    return stories[Math.floor(Math.random() * stories.length)];
  }

  static async getStoryForCommit(commit: Commit, state: { branches: Branch[], currentBranch: string }): Promise<string> {
    const context: StoryContext = {
      currentBranch: state.currentBranch,
      currentCommit: commit,
      branches: state.branches,
    };
    return this.generateStory(context);
  }
} 