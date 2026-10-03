export type Category = 'AI_LLM' | 'DEVOPS_SRE' | 'INFRA_CLOUD' | 'DATABASE' | 'BLOCKCHAIN' | 'SECURITY' | 'DATA_SCIENCE' | 'ARCHITECTURE' | 'MOBILE' | 'FRONTEND' | 'BACKEND' | 'OTHER';

export type ItemType = 'REPO' | 'BLOG' | 'DISCUSSION';

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

export interface Article {
  id: string;
  externalId: string;
  itemType: ItemType;
  source: string;
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

// Single source of truth for category styling. `dot` is a small marker, `text` is the label color.
export const categoryConfig: Record<Category, { label: string; dot: string; text: string }> = {
  AI_LLM: { label: 'AI/LLM', dot: 'bg-cat-ai', text: 'text-cat-ai' },
  DEVOPS_SRE: { label: 'DevOps/SRE', dot: 'bg-cat-devops', text: 'text-cat-devops' },
  INFRA_CLOUD: { label: 'Infra/Cloud', dot: 'bg-cat-cloud', text: 'text-cat-cloud' },
  DATABASE: { label: 'Database', dot: 'bg-cat-db', text: 'text-cat-db' },
  BLOCKCHAIN: { label: 'Blockchain', dot: 'bg-cat-chain', text: 'text-cat-chain' },
  SECURITY: { label: 'Security', dot: 'bg-cat-security', text: 'text-cat-security' },
  DATA_SCIENCE: { label: 'Data Science', dot: 'bg-cat-data', text: 'text-cat-data' },
  ARCHITECTURE: { label: 'Architecture', dot: 'bg-cat-arch', text: 'text-cat-arch' },
  MOBILE: { label: 'Mobile', dot: 'bg-cat-mobile', text: 'text-cat-mobile' },
  FRONTEND: { label: 'Frontend', dot: 'bg-cat-frontend', text: 'text-cat-frontend' },
  BACKEND: { label: 'Backend', dot: 'bg-cat-backend', text: 'text-cat-backend' },
  OTHER: { label: '기타', dot: 'bg-cat-other', text: 'text-cat-other' },
};

export const getCategoryInfo = (category: string) =>
  categoryConfig[category as Category] ?? categoryConfig.OTHER;

export type BenchmarkType =
  | 'TERMINAL_BENCH_HARD'
  | 'TAU_BENCH_TELECOM'
  | 'AA_LCR'
  | 'HUMANITYS_LAST_EXAM'
  | 'MMLU_PRO'
  | 'GPQA_DIAMOND'
  | 'LIVECODE_BENCH'
  | 'SCICODE'
  | 'IFBENCH'
  | 'MATH_500'
  | 'AIME'
  | 'AIME_2025'
  | 'AA_INTELLIGENCE_INDEX'
  | 'AA_CODING_INDEX'
  | 'AA_MATH_INDEX';

export type BenchmarkCategoryGroup = 'Composite' | 'Agentic' | 'Reasoning' | 'Coding' | 'Math' | 'Specialized';

export const benchmarkCategoryConfig: Record<BenchmarkCategoryGroup, {
  label: string;
  labelKo: string;
  color: string;
  icon: string;
}> = {
  Composite: {
    label: 'Composite',
    labelKo: '종합',
    color: 'bg-violet-600',
    icon: ''
  },
  Agentic: {
    label: 'Agentic',
    labelKo: '에이전틱',
    color: 'bg-purple-600',
    icon: ''
  },
  Reasoning: {
    label: 'Reasoning',
    labelKo: '추론',
    color: 'bg-indigo-600',
    icon: ''
  },
  Coding: {
    label: 'Coding',
    labelKo: '코딩',
    color: 'bg-blue-600',
    icon: ''
  },
  Math: {
    label: 'Math',
    labelKo: '수학',
    color: 'bg-cyan-600',
    icon: ''
  },
  Specialized: {
    label: 'Specialized',
    labelKo: '특수',
    color: 'bg-teal-600',
    icon: ''
  }
};

// Comment Types
export interface CommentAuthor {
  id: number;
  name: string;
  profileImageUrl?: string;
  flair?: string;
  flairColor?: string;
}

export interface Comment {
  id: string;
  content: string;
  deleted: boolean;
  parentId: string | null;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

export interface CommentTreeNode extends Comment {
  replies: CommentTreeNode[];
}

// My Page Types
export interface SavedArticle {
  articleId: string;
  summaryKoTitle: string;
  source: string;
  category: string;
  url: string;
  savedAt: string;
}

export interface ReadHistory {
  articleId: string;
  summaryKoTitle: string;
  source: string;
  category: string;
  url: string;
  readAt: string;
}



export interface ProjectSummary {
  id: string;
  name: string;
  fullName: string;
  stars: number;
  starsWeekDelta: number;
  language: string;
  languageColor: string;
  releases30d: number;
  sparklineData: number[];
}

export interface ProjectDetail {
  id: string;
  name: string;
  fullName: string;
  repoUrl: string;
  homepageUrl?: string;
  description: string;
  stars: number;
  forks: number;
  contributors: number;
  language: string;
  languageColor: string;
  license: string;
  lastRelease: string;
  tags: string[];
}

export type EventType = 'FEATURE' | 'FIX' | 'SECURITY' | 'BREAKING' | 'PERF' | 'MISC';

export interface HotRelease {
  id: string;
  projectName: string;
  version: string;
  releasedAt: string;
  eventTypes: EventType[];
  summary: string;
  impactScore: number;
  isSecurity: boolean;
  isBreaking: boolean;
}

export interface ProjectEvent {
  id: string;
  version: string;
  releasedAt: string;
  eventTypes: EventType[];
  summary: string;
  bullets: string[];
  impactScore: number;
  isSecurity: boolean;
  isBreaking: boolean;
  sourceUrl: string;
}

export interface StarHistoryPoint {
  date: string;
  stars: number;
}

export interface ProjectOverview {
  summary: string;
  highlights: string[];
  quickstart: string;
  links: string;
  sourceUrl: string;
  fetchedAt: string;
  summarizedAt: string;
}

export interface ProjectComment extends Comment {
  votes: number;
  userVote: 0 | 1 | -1;
}

export interface ProjectCommentTreeNode extends ProjectComment {
  replies: ProjectCommentTreeNode[];
}

