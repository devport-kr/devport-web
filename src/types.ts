export type Category = 'AI_LLM' | 'DEVOPS_SRE' | 'INFRA_CLOUD' | 'DATABASE' | 'BLOCKCHAIN' | 'SECURITY' | 'DATA_SCIENCE' | 'ARCHITECTURE' | 'MOBILE' | 'FRONTEND' | 'BACKEND' | 'OTHER';

export type ItemType = 'REPO' | 'BLOG' | 'DISCUSSION';

export type Source = 'github' | 'hackernews' | 'reddit' | 'medium' | 'devto' | 'hashnode';

// GitRepo Entity (separate from Article)
export interface GitRepo {
  id: number;
  fullName: string;
  url: string;
  description?: string;
  language: string;
  stars: number;
  forks: number;
  starsThisWeek: number;
  summaryKoTitle: string;
  summaryKoBody?: string;
  category: Category;
  score: number;
  createdAt: string;
  updatedAt: string;
}

// Article Entity (for blogs, discussions)
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
  INFRA_CLOUD: { label: 'Infra/Cloud', color: 'bg-amber-600' },
  DATABASE: { label: 'Database', color: 'bg-emerald-600' },
  BLOCKCHAIN: { label: 'Blockchain', color: 'bg-yellow-600' },
  SECURITY: { label: 'Security', color: 'bg-red-600' },
  DATA_SCIENCE: { label: 'Data Science', color: 'bg-blue-600' },
  ARCHITECTURE: { label: 'Architecture', color: 'bg-indigo-600' },
  MOBILE: { label: 'Mobile', color: 'bg-pink-600' },
  FRONTEND: { label: 'Frontend', color: 'bg-teal-600' },
  BACKEND: { label: 'Backend', color: 'bg-green-600' },
  OTHER: { label: '기타', color: 'bg-gray-600' },
};

export const sourceConfig: Record<Source, { label: string; icon: string }> = {
  github: { label: 'GitHub', icon: '📦' },
  hackernews: { label: 'Hacker News', icon: '📰' },
  reddit: { label: 'Reddit', icon: '💬' },
  medium: { label: 'Medium', icon: '📝' },
  devto: { label: 'Dev.to', icon: '📝' },
  hashnode: { label: 'Hashnode', icon: '📝' },
};

// LLM Leaderboard Types - 15 Available Benchmarks from Artificial Analysis
// Note: CRIT_PT, MMMU_PRO, AA_OMNISCIENCE_INDEX are not available in API v2
export type BenchmarkType =
  // Agentic (2)
  | 'TERMINAL_BENCH_HARD'
  | 'TAU_BENCH_TELECOM'
  // Reasoning (4)
  | 'AA_LCR'
  | 'HUMANITYS_LAST_EXAM'
  | 'MMLU_PRO'
  | 'GPQA_DIAMOND'
  // Coding (3)
  | 'LIVECODE_BENCH'
  | 'SCICODE'
  | 'IFBENCH'
  // Math (3)
  | 'MATH_500'
  | 'AIME'
  | 'AIME_2025'
  // Composite Indices (3)
  | 'AA_INTELLIGENCE_INDEX'
  | 'AA_CODING_INDEX'
  | 'AA_MATH_INDEX';

export type BenchmarkCategoryGroup = 'Intelligence' | 'Agentic' | 'Reasoning' | 'Coding' | 'Math' | 'Specialized';

// Benchmark metadata (fetched from backend)
export interface LLMBenchmark {
  benchmarkType: BenchmarkType;
  displayName: string;
  categoryGroup: BenchmarkCategoryGroup;
  description: string;
  explanation?: string;
  sortOrder?: number;
}

// LLM Model summary (for leaderboard lists)
export interface LLMModelSummary {
  id: number;
  modelId: string;
  slug: string;
  modelName: string;
  provider: string;
  modelCreatorName?: string;
  license?: string;
  priceBlended?: number;
  contextWindow?: number;
  scoreAaIntelligenceIndex?: number;
}

// LLM Model detail (includes all benchmark scores)
export interface LLMModelDetail {
  id: number;
  externalId?: string;
  slug: string;
  modelId: string;
  modelName: string;
  releaseDate?: string;
  provider: string;
  modelCreatorId?: number;
  modelCreatorName?: string;
  description?: string;

  // Pricing
  priceInput?: number;
  priceOutput?: number;
  priceBlended?: number;

  // Performance
  contextWindow?: number;
  outputSpeedMedian?: number;
  latencyTtft?: number;
  medianTimeToFirstAnswerToken?: number;
  license?: string;

  // 15 Available Benchmark scores (0-100 scale)
  // Agentic (2)
  scoreTerminalBenchHard?: number;
  scoreTauBenchTelecom?: number;
  // Reasoning (4)
  scoreAaLcr?: number;
  scoreHumanitysLastExam?: number;
  scoreMmluPro?: number;
  scoreGpqaDiamond?: number;
  // Coding (3)
  scoreLivecodeBench?: number;
  scoreScicode?: number;
  scoreIfbench?: number;
  // Math (3)
  scoreMath500?: number;
  scoreAime?: number;
  scoreAime2025?: number;
  // Composite (3)
  scoreAaIntelligenceIndex?: number;
  scoreAaCodingIndex?: number;
  scoreAaMathIndex?: number;
}

// Leaderboard entry (model with rank and score for specific benchmark)
export interface LLMLeaderboardEntry {
  rank: number;
  modelId: string;
  modelName: string;
  provider: string;
  modelCreatorName?: string;
  score: number;
  license?: string;
  priceBlended?: number;
  contextWindow?: number;
}

// Category group configuration
export const benchmarkCategoryConfig: Record<BenchmarkCategoryGroup, {
  label: string;
  labelKo: string;
  color: string;
  icon: string;
}> = {
  Intelligence: {
    label: 'Intelligence',
    labelKo: '종합 지능',
    color: 'bg-violet-600',
    icon: '📊'
  },
  Agentic: {
    label: 'Agentic',
    labelKo: '에이전틱',
    color: 'bg-purple-600',
    icon: '🤖'
  },
  Reasoning: {
    label: 'Reasoning',
    labelKo: '추론',
    color: 'bg-indigo-600',
    icon: '🧠'
  },
  Coding: {
    label: 'Coding',
    labelKo: '코딩',
    color: 'bg-blue-600',
    icon: '💻'
  },
  Math: {
    label: 'Math',
    labelKo: '수학',
    color: 'bg-cyan-600',
    icon: '📐'
  },
  Specialized: {
    label: 'Specialized',
    labelKo: '특수 분야',
    color: 'bg-teal-600',
    icon: '🎯'
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
