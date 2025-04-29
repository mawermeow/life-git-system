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
      const prompt = this.buildPrompt(context);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一個富有哲學思維和幽默感的敘事者，擅長用輕鬆的方式講述深刻的人生故事。你的故事應該包含：1. 這個變更的意義 2. 對當前分支的影響 3. 一個有趣的比喻或啟示。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('故事生成失敗:', error);
      return this.getFallbackStory(context);
    }
  }

  private static buildPrompt(context: StoryContext): string {
    const { currentBranch, currentCommit, branches } = context;
    const branchNames = branches.map(b => b.name).join(', ');

    return `你正在記錄一個人生變更。當前分支是「${currentBranch}」，你剛剛記錄了以下commit：「${currentCommit.message}」。
    
    你的人生分支有：${branchNames}。
    
    請用幽默且富有哲學意味的方式，描述這個變更的意義和影響。保持簡潔，不要超過 100 字。`;
  }

  private static getFallbackStory(context: StoryContext): string {
    const { currentCommit, currentBranch } = context;
    const stories = [
      `在「${currentBranch}」的旅程中，你記錄了commit「${currentCommit.message}」。這個變更像一顆石子投入平靜的湖面，激起層層漣漪，影響著你未來的每一步。`,
      `「${currentCommit.message}」——這不僅僅是一個變更，更是一個里程碑。在「${currentBranch}」的旅程中，你將為這個變更付出代價，也將收穫成長。`,
      `人生就像一本書，在「${currentBranch}」這一章，你記錄了「${currentCommit.message}」。這個變更將如何影響故事的走向？只有時間能給出答案。`,
      `站在「${currentBranch}」的十字路口，你記錄了「${currentCommit.message}」。這個變更或許微不足道，卻可能改變你的人生軌跡。`,
      `「${currentCommit.message}」——在「${currentBranch}」的旅程中，這是一個重要的記錄。它標誌著你經歷了這個時刻，也意味著你將繼續前進。`
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