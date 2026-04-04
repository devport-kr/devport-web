import apiClient from '../../lib/http/apiClient';
import type { Article, GitRepo } from '../../types';

// ─── Article Types ───────────────────────────────────────────────

export interface ArticlePageResponse {
  content: Article[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

export interface GitRepoPageResponse {
  content: GitRepo[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

export interface TrendingTickerResponse {
  id: number;
  externalId: string;
  summaryKoTitle: string;
  url: string;
  createdAtSource: string;
}

export interface ArticleDetailResponse {
  externalId: string;
  itemType: 'BLOG' | 'DISCUSSION' | 'REPO';
  source: string;
  category: string;
  summaryKoTitle: string;
  summaryKoBody: string;
  titleEn: string;
  url: string;
  score: number;
  tags: string[];
  createdAtSource: string;
  metadata: {
    stars?: number;
    comments?: number;
    upvotes?: number;
    readTime?: string;
    language?: string;
  };
}

// ─── Article APIs ────────────────────────────────────────────────

export const getArticles = async (
  category?: string,
  page: number = 0,
  size: number = 9
): Promise<ArticlePageResponse> => {
  const params: Record<string, string | number> = { page, size };
  if (category && category !== 'ALL') {
    params.category = category;
  }

  const response = await apiClient.get<ArticlePageResponse>('/api/articles', { params });
  return response.data;
};

export const getArticleByExternalId = async (externalId: string): Promise<ArticleDetailResponse> => {
  const response = await apiClient.get<ArticleDetailResponse>(`/api/articles/${externalId}`);
  return response.data;
};

export const getTrendingTicker = async (limit: number = 20): Promise<TrendingTickerResponse[]> => {
  const [tickerResponse, articlesResponse] = await Promise.all([
    apiClient.get<Array<Omit<TrendingTickerResponse, 'externalId'>>>('/api/articles/trending-ticker', {
      params: { limit },
    }),
    apiClient.get<ArticlePageResponse>('/api/articles', {
      params: { page: 0, size: 500 },
    }),
  ]);

  const externalIdById = new Map(
    articlesResponse.data.content.map((article) => [Number(article.id), article.externalId])
  );

  return tickerResponse.data
    .map((article) => {
      const externalId = externalIdById.get(article.id);
      if (!externalId) {
        return null;
      }

      return {
        ...article,
        externalId,
      };
    })
    .filter((article): article is TrendingTickerResponse => article !== null);
};

/** @deprecated Use getGitRepos or getTrendingGitRepos instead */
export const getGitHubTrending = async (limit: number = 10): Promise<Article[]> => {
  const response = await apiClient.get<Article[]>('/api/articles/github-trending', {
    params: { limit },
  });
  return response.data;
};

// ─── GitRepo APIs ────────────────────────────────────────────────

export const getGitRepos = async (
  category?: string,
  page: number = 0,
  size: number = 10
): Promise<GitRepoPageResponse> => {
  const params: Record<string, string | number> = { page, size };
  if (category && category !== 'ALL') {
    params.category = category;
  }

  const response = await apiClient.get<GitRepoPageResponse>('/api/git-repos', { params });
  return response.data;
};

export const getTrendingGitRepos = async (limit: number = 10): Promise<GitRepo[]> => {
  const response = await apiClient.get<GitRepo[]>('/api/git-repos/trending', {
    params: { limit },
  });
  return response.data;
};

export const getTrendingGitReposPaginated = async (
  page: number = 0,
  size: number = 10
): Promise<GitRepoPageResponse> => {
  const response = await apiClient.get<GitRepoPageResponse>('/api/git-repos/trending', {
    params: { page, size },
  });
  return response.data;
};

export const getGitReposByLanguage = async (language: string, limit: number = 10): Promise<GitRepo[]> => {
  const response = await apiClient.get<GitRepo[]>(`/api/git-repos/language/${language}`, {
    params: { limit },
  });
  return response.data;
};

export const getTopWeeklyGitRepos = async (): Promise<GitRepo[]> => {
  const response = await apiClient.get<GitRepo[]>('/api/git-repos/top-weekly');
  return response.data;
};

// ─── Article View Tracking ───────────────────────────────────────

export const trackArticleView = async (articleId: string): Promise<void> => {
  try {
    await apiClient.post(`/api/articles/${articleId}/view`);
  } catch (error) {
    // Silent fail - view tracking is non-critical
    console.error('Failed to track article view:', error);
  }
};
