import { Commit, Branch } from '../types/game';

interface StoryContext {
  currentBranch: string;
  currentCommit: Commit;
  branches: Branch[];
}

export class StoryGenerator {
  private static async generateStory(context: StoryContext): Promise<string> {
    const prompt = this.buildPrompt(context);
    try {
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
              content: '你是一個富有哲學思維和幽默感的敘事者，擅長用輕鬆的方式講述深刻的人生故事。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
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
    
    return `你正在經歷一個人生選擇。當前分支是「${currentBranch}」，你剛剛做了以下選擇：「${currentCommit.message}」。
    
    你的人生分支有：${branchNames}。
    
    請用幽默且富有哲學意味的方式，描述這個選擇對你人生的影響。保持簡潔，不要超過 100 字。`;
  }

  private static getFallbackStory(context: StoryContext): string {
    const { currentCommit } = context;
    return `你選擇了「${currentCommit.message}」。這是一個重要的決定，它將影響你的人生走向。`;
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