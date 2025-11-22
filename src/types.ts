export type Category = 'AI_LLM' | 'DEVOPS_SRE' | 'BACKEND' | 'INFRA_CLOUD' | 'OTHER';

export type ItemType = 'REPO' | 'BLOG' | 'DISCUSSION';

export type Source = 'github' | 'hackernews' | 'reddit' | 'medium' | 'devto' | 'hashnode';

export interface Article {
  id: string;
  itemType: ItemType;
  source: Source;
  category: Category;
  summaryKoTitle: string;
  summaryKoBody?: string;
  titleEn: string;
  url: string;
  score: number;
  tags: string[];
  createdAtSource: string;
  metadata?: {
    stars?: number;
    comments?: number;
    upvotes?: number;
    readTime?: string;
    language?: string;
  };
}

export const categoryConfig: Record<Category, { label: string; color: string }> = {
  AI_LLM: { label: 'AI/LLM', color: 'bg-purple-600' },
  DEVOPS_SRE: { label: 'DevOps/SRE', color: 'bg-cyan-600' },
  BACKEND: { label: 'Backend', color: 'bg-green-600' },
  INFRA_CLOUD: { label: 'Infra/Cloud', color: 'bg-amber-600' },
  OTHER: { label: 'Other', color: 'bg-gray-600' },
};

export const sourceConfig: Record<Source, { label: string; icon: string }> = {
  github: { label: 'GitHub', icon: '📦' },
  hackernews: { label: 'Hacker News', icon: '📰' },
  reddit: { label: 'Reddit', icon: '💬' },
  medium: { label: 'Medium', icon: '📝' },
  devto: { label: 'Dev.to', icon: '📝' },
  hashnode: { label: 'Hashnode', icon: '📝' },
};
