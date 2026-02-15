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

// Ports Types
export interface Port {
  id: string;
  portNumber: number;
  slug: string;
  name: string;
  description: string;
  accentColor: string;
  projectCount: number;
  recentReleaseCount: number;
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

export interface PortDetailResponse {
  port: Port;
  projects: ProjectSummary[];
  hotReleases: HotRelease[];
}
