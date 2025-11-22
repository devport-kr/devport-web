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

// LLM Leaderboard Types
export type BenchmarkType = 'AGENTIC_CODING' | 'REASONING' | 'MATH' | 'VISUAL' | 'MULTILINGUAL';

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  score: number;
  contextWindow?: string;
  pricing?: string;
}

export const benchmarkConfig: Record<BenchmarkType, {
  label: string;
  labelKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
}> = {
  AGENTIC_CODING: {
    label: 'Agentic Coding',
    labelKo: '에이전틱 코딩',
    description: 'Data from the SWE Benchmark that evaluates if LLMs can resolve GitHub Issues. It measures agentic reasoning.',
    descriptionKo: 'LLM이 GitHub 이슈를 해결할 수 있는지 평가하는 SWE 벤치마크 데이터입니다. 에이전틱 추론 능력을 측정합니다.',
    icon: '💻'
  },
  REASONING: {
    label: 'Reasoning',
    labelKo: '추론 능력',
    description: 'Data from the GPQA Diamond, a very complex benchmark that evaluates quality and reliability across biology, physics, and chemistry.',
    descriptionKo: '생물학, 물리학, 화학 분야의 품질과 신뢰성을 평가하는 매우 복잡한 벤치마크인 GPQA 다이아몬드의 데이터입니다.',
    icon: '🧠'
  },
  MATH: {
    label: 'High School Math',
    labelKo: '고급 수학',
    description: 'Data from the AIME 2024, a competitive high school math benchmark.',
    descriptionKo: '경쟁적인 고등학교 수학 벤치마크인 AIME 2024의 데이터입니다.',
    icon: '📐'
  },
  VISUAL: {
    label: 'Visual Reasoning',
    labelKo: '시각 추론',
    description: 'ARC-AGI-2 which challenges systems to demonstrate both high adaptability and high efficiency.',
    descriptionKo: '시스템이 높은 적응성과 효율성을 모두 입증하도록 요구하는 ARC-AGI-2 벤치마크입니다.',
    icon: '👁️'
  },
  MULTILINGUAL: {
    label: 'Multilingual',
    labelKo: '다국어 처리',
    description: 'MMMLU which covers a broad range of topics from 57 different categories, covering elementary-level knowledge up to advanced professional subjects like law, physics, history, and computer science in 14 languages.',
    descriptionKo: '법학, 물리학, 역사, 컴퓨터 과학과 같은 전문 과목부터 초등 수준의 지식까지 57개 카테고리의 광범위한 주제를 14개 언어로 다루는 MMMLU 벤치마크입니다.',
    icon: '🌐'
  }
};

// Centralized icon configuration for easy replacement with custom icons
export const icons = {
  // Section icons
  githubLeaderboard: '🏆',
  llmLeaderboard: '🤖',
  trendingBlog: '📚',

  // Metadata icons
  time: '🕐',
  star: '⭐',
  comment: '💬',
  upvote: '⬆️',
  readTime: '📖',
  language: '🌐',
} as const;
