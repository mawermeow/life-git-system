import { Commit, Branch } from '../types/game';

interface StoryContext {
  currentBranch: string;
  currentCommit: Commit;
  branches: Branch[];
  previousBranch?: string;
  previousCommits?: Commit[];
}

export class StoryGenerator {
  private static async generateStory(context: StoryContext): Promise<string> {
    const { currentBranch, currentCommit, branches, previousBranch, previousCommits } = context;
    const branchNames = branches.map(b => b.name).join(', ');

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
              content: '你是一個毒舌又幽默的敘事者，擅長用諷刺和調侃的方式講述故事。你的故事應該：1. 用誇張的方式描述變更 2. 用諷刺的語氣分析影響 3. 用幽默的比喻來總結。可以適度地嘲笑用戶的選擇，但不要太過分。',
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
    const { currentBranch, currentCommit, branches, previousBranch, previousCommits } = context;
    const branchNames = branches.map(b => b.name).join(', ');

    if (previousBranch) {
      const previousMessages = previousCommits?.map(c => c.message).join('、') || '無';
      return `你正在切換人生分支。你從「${previousBranch}」分支（最近的變更：${previousMessages}）切換到了「${currentBranch}」分支。
      
      你的人生分支有：${branchNames}。
      
      請用毒舌又幽默的方式，分析這個切換的動機和影響。可以盡情地嘲笑用戶的選擇，但不要太過分。保持簡潔，不要超過 100 字。`;
    }

    return `你正在記錄一個人生變更。當前分支是「${currentBranch}」，你剛剛記錄了以下變更：「${currentCommit.message}」。
    
    你的人生分支有：${branchNames}。
    
    請用毒舌又幽默的方式，描述這個變更的意義和影響。可以適度地嘲笑用戶的選擇。保持簡潔，不要超過 100 字。`;
  }

  private static getFallbackStory(context: StoryContext): string {
    const { currentCommit, currentBranch, previousBranch, previousCommits } = context;
    
    if (previousBranch) {
      const previousMessages = previousCommits?.map(c => c.message).join('、') || '無';
      const stories = [
        `從「${previousBranch}」的「${previousMessages}」逃到「${currentBranch}」？看來你終於受不了之前的選擇了！這次的選擇會不會又是一場災難呢？讓我們拭目以待！`,
        `在「${previousBranch}」經歷了「${previousMessages}」後，你選擇了「${currentBranch}」作為避風港。希望這次的選擇不會像上次一樣糟糕！`,
        `從「${previousBranch}」的「${previousMessages}」到「${currentBranch}」，你的人生就像在玩跳棋，永遠在尋找更好的位置，但似乎永遠找不到！`,
        `在「${previousBranch}」經歷了「${previousMessages}」後，你決定換個環境，來到了「${currentBranch}」。這次的選擇會不會又是一場災難呢？讓我們拭目以待！`,
        `從「${previousBranch}」的「${previousMessages}」到「${currentBranch}」，你的人生就像在玩俄羅斯方塊，永遠在尋找最適合的位置，但似乎永遠找不到！`
      ];
      return stories[Math.floor(Math.random() * stories.length)];
    }

    const stories = [
      `在「${currentBranch}」的旅程中，你記錄了「${currentCommit.message}」。這個變更像一顆石子投入平靜的湖面，激起層層漣漪，影響著你未來的每一步。希望這次的選擇不會像上次一樣糟糕！`,
      `「${currentCommit.message}」——這不僅僅是一個變更，更是一個里程碑。在「${currentBranch}」的旅程中，你將為這個變更付出代價，也將收穫成長。希望這次的成長不會太痛苦！`,
      `人生就像一本書，在「${currentBranch}」這一章，你記錄了「${currentCommit.message}」。這個變更將如何影響故事的走向？讓我們拭目以待，看看這次會不會又是一場災難！`,
      `站在「${currentBranch}」的十字路口，你記錄了「${currentCommit.message}」。這個變更或許微不足道，卻可能改變你的人生軌跡。希望這次的改變不會太糟糕！`,
      `「${currentCommit.message}」——在「${currentBranch}」的旅程中，這是一個重要的記錄。它標誌著你經歷了這個時刻，也意味著你將繼續前進。希望這次的前進不會太痛苦！`
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

  static async getStoryForCheckout(
    currentBranch: string,
    previousBranch: string,
    state: { branches: Branch[], currentBranch: string }
  ): Promise<string> {
    const previousBranchData = state.branches.find(b => b.name === previousBranch);
    const context: StoryContext = {
      currentBranch,
      currentCommit: { id: '', message: '', timestamp: 0, parentIds: [] },
      branches: state.branches,
      previousBranch,
      previousCommits: previousBranchData?.commits.slice(0, 3),
    };
    return this.generateStory(context);
  }
}