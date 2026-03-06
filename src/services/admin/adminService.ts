import apiClient from '../../lib/http/apiClient';
import type { Article, GitRepo } from '../../types';
import type { ArticlePageResponse } from '../articles/articlesService';
import type { LLMModelDetailResponse, LLMBenchmarkResponse } from '../llm/llmService';

// ─── Admin Request Types ─────────────────────────────────────────

export interface CreateArticleRequest {
  itemType: 'BLOG' | 'DISCUSSION' | 'REPO';
  source: string;
  category: string;
  summaryKoTitle: string;
  summaryKoBody?: string;
  titleEn: string;
  url: string;
  score: number;
  tags?: string[];
  createdAtSource: string;
  metadata?: {
    stars?: number;
    comments?: number;
    upvotes?: number;
    readTime?: string;
    language?: string;
  };
}

export interface CreateGitRepoRequest {
  fullName: string;
  url: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  starsThisWeek?: number;
  summaryKoTitle?: string;
  summaryKoBody?: string;
  category?: string;
  score: number;
}

/**
 * Request for POST /api/admin/projects (GitHub auto-fetch endpoint).
 * Only fullName is required; all other fields are optional overrides.
 * The backend will auto-fetch stars, forks, language, license, description,
 * repoUrl, and homepageUrl from GitHub's public API.
 */
export interface CreateProjectRequest {
  fullName: string;
  repoUrl?: string;
  homepageUrl?: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  license?: string;
  starsThisWeek?: number;
  summaryKoTitle?: string;
  summaryKoBody?: string;
  category?: string;
  score?: number;
}

export interface CreateLLMModelRequest {
  externalId?: string;
  slug?: string;
  modelId: string;
  modelName: string;
  releaseDate?: string;
  provider?: string;
  modelCreatorId?: number;
  description?: string;
  priceInput?: number;
  priceOutput?: number;
  priceBlended?: number;
  contextWindow?: number;
  outputSpeedMedian?: number;
  latencyTtft?: number;
  medianTimeToFirstAnswerToken?: number;
  license?: string;
  scoreTerminalBenchHard?: number;
  scoreTauBenchTelecom?: number;
  scoreAaLcr?: number;
  scoreHumanitysLastExam?: number;
  scoreMmluPro?: number;
  scoreGpqaDiamond?: number;
  scoreLivecodeBench?: number;
  scoreScicode?: number;
  scoreIfbench?: number;
  scoreMath500?: number;
  scoreAime?: number;
  scoreAime2025?: number;
  scoreAaIntelligenceIndex?: number;
  scoreAaCodingIndex?: number;
  scoreAaMathIndex?: number;
}

export interface CreateModelCreatorRequest {
  externalId?: string;
  slug: string;
  name: string;
}

export interface CreateLLMBenchmarkRequest {
  benchmarkType: string;
  displayName: string;
  categoryGroup: string;
  description: string;
  explanation?: string;
  sortOrder: number;
}

export interface ArticleLLMCreateRequest {
  titleEn: string;
  url: string;
  content: string;
  source: string;
  itemType?: 'BLOG' | 'DISCUSSION' | 'REPO';
  tags?: string[];
  metadata?: {
    stars?: number;
    comments?: number;
    upvotes?: number;
    readTime?: string;
    language?: string;
  };
}

export interface ArticleLLMPreviewResponse {
  isTechnical: boolean;
  titleKo: string;
  summaryKo: string;
  category: string;
  tags: string[];
  url: string;
  titleEn: string;
  source: string;
}

// ─── Admin Article APIs ──────────────────────────────────────────

export const adminCreateArticle = async (data: CreateArticleRequest): Promise<Article> => {
  const response = await apiClient.post<Article>('/api/admin/articles', data);
  return response.data;
};

export const adminUpdateArticle = async (id: string, data: Partial<CreateArticleRequest>): Promise<Article> => {
  const response = await apiClient.put<Article>(`/api/admin/articles/${id}`, data);
  return response.data;
};

export const adminDeleteArticle = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/articles/${id}`);
};

export const adminProcessArticleWithLLM = async (data: ArticleLLMCreateRequest): Promise<Article> => {
  const response = await apiClient.post<Article>('/api/admin/articles/llm-process', data);
  return response.data;
};

export const adminPreviewArticleLLM = async (data: ArticleLLMCreateRequest): Promise<ArticleLLMPreviewResponse> => {
  const response = await apiClient.post<ArticleLLMPreviewResponse>('/api/admin/articles/llm-preview', data);
  return response.data;
};

export const adminListArticles = async (
  page: number = 0,
  size: number = 20,
  search?: string
): Promise<ArticlePageResponse> => {
  const params: Record<string, string | number> = { page, size };
  if (search) {
    params.search = search;
  }
  const response = await apiClient.get<ArticlePageResponse>('/api/admin/articles', { params });
  return response.data;
};

// ─── Admin GitRepo APIs ──────────────────────────────────────────

export const adminCreateGitRepo = async (data: CreateGitRepoRequest): Promise<GitRepo> => {
  const response = await apiClient.post<GitRepo>('/api/admin/git-repos', data);
  return response.data;
};

export const adminUpdateGitRepo = async (id: number, data: Partial<CreateGitRepoRequest>): Promise<GitRepo> => {
  const response = await apiClient.put<GitRepo>(`/api/admin/git-repos/${id}`, data);
  return response.data;
};

export const adminDeleteGitRepo = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/git-repos/${id}`);
};

// ─── Admin Project APIs (GitHub auto-fetch) ──────────────────────

/**
 * Create a project by fullName only. The backend auto-fetches metadata from
 * GitHub. Any supplied fields override the auto-fetched values.
 */
export const adminCreateProject = async (data: CreateProjectRequest): Promise<GitRepo> => {
  const response = await apiClient.post<GitRepo>('/api/admin/projects', data);
  return response.data;
};

export interface BulkProjectCreateResult {
  id?: number;
  externalId?: string;
  fullName: string;
  error?: string;
}

export interface BulkProjectCreateResponse {
  created: BulkProjectCreateResult[];
  failed: BulkProjectCreateResult[];
}

/**
 * Bulk-create projects from a list of fullName entries.
 * Returns HTTP 201 if all succeed, HTTP 207 on partial failure.
 */
export const adminCreateProjectsBulk = async (
  items: CreateProjectRequest[],
): Promise<BulkProjectCreateResponse> => {
  const response = await apiClient.post<BulkProjectCreateResponse>(
    '/api/admin/projects/bulk',
    items,
  );
  return response.data;
};

// ─── Admin LLM Model APIs ───────────────────────────────────────

export const adminCreateLLMModel = async (data: CreateLLMModelRequest): Promise<LLMModelDetailResponse> => {
  const response = await apiClient.post<LLMModelDetailResponse>('/api/admin/llm-models', data);
  return response.data;
};

export const adminUpdateLLMModel = async (id: number, data: Partial<CreateLLMModelRequest>): Promise<LLMModelDetailResponse> => {
  const response = await apiClient.put<LLMModelDetailResponse>(`/api/admin/llm-models/${id}`, data);
  return response.data;
};

export const adminDeleteLLMModel = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/llm-models/${id}`);
};

// ─── Admin Model Creator APIs ────────────────────────────────────

export const adminCreateModelCreator = async (data: CreateModelCreatorRequest): Promise<{ id: number; slug: string; name: string }> => {
  const response = await apiClient.post('/api/admin/model-creators', data);
  return response.data;
};

export const adminUpdateModelCreator = async (id: number, data: Partial<CreateModelCreatorRequest>): Promise<{ id: number; slug: string; name: string }> => {
  const response = await apiClient.put(`/api/admin/model-creators/${id}`, data);
  return response.data;
};

export const adminDeleteModelCreator = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/model-creators/${id}`);
};

// ─── Admin Benchmark APIs ────────────────────────────────────────

export const adminCreateBenchmark = async (data: CreateLLMBenchmarkRequest): Promise<LLMBenchmarkResponse> => {
  const response = await apiClient.post<LLMBenchmarkResponse>('/api/admin/llm-benchmarks', data);
  return response.data;
};

export const adminUpdateBenchmark = async (benchmarkType: string, data: Partial<CreateLLMBenchmarkRequest>): Promise<LLMBenchmarkResponse> => {
  const response = await apiClient.put<LLMBenchmarkResponse>(`/api/admin/llm-benchmarks/${benchmarkType}`, data);
  return response.data;
};

export const adminDeleteBenchmark = async (benchmarkType: string): Promise<void> => {
  await apiClient.delete(`/api/admin/llm-benchmarks/${benchmarkType}`);
};
