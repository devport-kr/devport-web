import axios from 'axios';
import type { Article, GitRepo, BenchmarkType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// Add access token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the token refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Store new access token
        localStorage.setItem('accessToken', accessToken);

        // Update authorization header
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
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
  id: string;
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

// LLM API Response Types (matching backend DTOs)
export interface LLMModelSummaryResponse {
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

export interface LLMModelDetailResponse {
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
  priceInput?: number;
  priceOutput?: number;
  priceBlended?: number;
  contextWindow?: number;
  outputSpeedMedian?: number;
  latencyTtft?: number;
  medianTimeToFirstAnswerToken?: number;
  license?: string;
  // 15 Available Benchmarks (excluding CRIT_PT, MMMU_PRO, AA_OMNISCIENCE_INDEX)
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

export interface LLMLeaderboardEntryResponse {
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

export interface LLMBenchmarkResponse {
  benchmarkType: string;
  displayName: string;
  categoryGroup: string;
  description: string;
  explanation?: string;
  sortOrder?: number;
}

export interface UserResponse {
  id: number;
  email: string;
  username?: string;
  name: string;
  profileImageUrl?: string;
  authProvider: 'github' | 'google' | 'naver' | 'local';
  role: 'USER' | 'ADMIN';
  emailVerified?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// Signup & Login Request/Response Types
export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileUpdateRequest {
  email?: string;
  name?: string;
  profileImageUrl?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// Article APIs
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

// GitRepo APIs
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

// Legacy Article APIs (kept for backward compatibility if needed)
export const getGitHubTrending = async (limit: number = 10): Promise<Article[]> => {
  const response = await apiClient.get<Article[]>('/api/articles/github-trending', {
    params: { limit },
  });
  return response.data;
};

export const getTrendingTicker = async (limit: number = 20): Promise<TrendingTickerResponse[]> => {
  const response = await apiClient.get<TrendingTickerResponse[]>('/api/articles/trending-ticker', {
    params: { limit },
  });
  return response.data;
};

export const getArticleByExternalId = async (externalId: string): Promise<ArticleDetailResponse> => {
  const response = await apiClient.get<ArticleDetailResponse>(`/api/articles/${externalId}`);
  return response.data;
};

// LLM Ranking APIs
export const getLLMLeaderboard = async (
  benchmarkType: BenchmarkType,
  filters?: {
    provider?: string;
    creatorSlug?: string;
    license?: string;
    maxPrice?: number;
    minContextWindow?: number;
  }
): Promise<LLMLeaderboardEntryResponse[]> => {
  const response = await apiClient.get<LLMLeaderboardEntryResponse[]>(
    `/api/llm/leaderboard/${benchmarkType}`,
    { params: filters }
  );
  return response.data;
};

export const getAllLLMBenchmarks = async (): Promise<LLMBenchmarkResponse[]> => {
  const response = await apiClient.get<LLMBenchmarkResponse[]>('/api/llm/benchmarks');
  return response.data;
};

export const getLLMBenchmarksByGroup = async (categoryGroup: string): Promise<LLMBenchmarkResponse[]> => {
  const response = await apiClient.get<LLMBenchmarkResponse[]>(`/api/llm/benchmarks/${categoryGroup}`);
  return response.data;
};

export const getLLMModelById = async (modelId: string): Promise<LLMModelDetailResponse> => {
  const response = await apiClient.get<LLMModelDetailResponse>(`/api/llm/models/${modelId}`);
  return response.data;
};

// Auth APIs
export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/api/auth/me');
  return response.data;
};

export const initiateOAuthLogin = (provider: 'github' | 'google' | 'naver', turnstileToken: string): void => {
  // Spring Security OAuth2 default endpoint is /oauth2/authorization/{registrationId}
  // Append Turnstile token as query parameter for backend validation
  window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}?turnstile_token=${encodeURIComponent(turnstileToken)}`;
};

export const logout = async (): Promise<void> => {
  try {
    // Call backend to revoke refresh tokens
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear tokens from localStorage regardless of API call result
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  }
};

// Local Authentication APIs
export const signup = async (data: SignupRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/api/auth/signup', data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/api/auth/login', data);
  return response.data;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    await apiClient.get('/api/auth/check-username', { params: { username } });
    return true; // Available
  } catch (error) {
    return false; // Not available
  }
};

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  try {
    await apiClient.get('/api/auth/check-email', { params: { email } });
    return true; // Available
  } catch (error) {
    return false; // Not available
  }
};

// Profile Management APIs
export const updateProfile = async (data: ProfileUpdateRequest): Promise<UserResponse> => {
  const response = await apiClient.put<UserResponse>('/api/profile', data);
  return response.data;
};

export const changePassword = async (data: PasswordChangeRequest): Promise<void> => {
  await apiClient.post('/api/profile/change-password', data);
};

export const removeEmail = async (): Promise<void> => {
  await apiClient.delete('/api/profile/email');
};

// Admin API Types
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

// Admin Article APIs
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

// Admin GitRepo APIs
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

// Admin LLM Model APIs
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

// Admin Model Creator APIs
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

// Admin Benchmark APIs
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

// Comment API Types
export interface CommentAuthorResponse {
  id: number;
  name: string;
  profileImageUrl?: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  deleted: boolean;
  parentId: string | null;
  author: CommentAuthorResponse;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

export interface CommentCreateRequest {
  content: string;
  parentCommentId?: string;
}

export interface CommentUpdateRequest {
  content: string;
}

// Comment APIs
export const getCommentsByArticle = async (articleId: string): Promise<CommentResponse[]> => {
  const response = await apiClient.get<CommentResponse[]>(`/api/articles/${articleId}/comments`);
  return response.data;
};

export const createComment = async (
  articleId: string,
  data: CommentCreateRequest
): Promise<CommentResponse> => {
  const response = await apiClient.post<CommentResponse>(`/api/articles/${articleId}/comments`, data);
  return response.data;
};

export const updateComment = async (
  articleId: string,
  commentId: string,
  data: CommentUpdateRequest
): Promise<CommentResponse> => {
  const response = await apiClient.put<CommentResponse>(
    `/api/articles/${articleId}/comments/${commentId}`,
    data
  );
  return response.data;
};

export const deleteComment = async (articleId: string, commentId: string): Promise<void> => {
  await apiClient.delete(`/api/articles/${articleId}/comments/${commentId}`);
};

// My Page API Types
export interface SavedArticleResponse {
  articleId: string;
  summaryKoTitle: string;
  source: string;
  category: string;
  url: string;
  savedAt: string;
}

export interface ReadHistoryResponse {
  articleId: string;
  summaryKoTitle: string;
  source: string;
  category: string;
  url: string;
  readAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

// My Page APIs
export const getSavedArticles = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<SavedArticleResponse>> => {
  const response = await apiClient.get<PageResponse<SavedArticleResponse>>('/api/me/saved-articles', {
    params: { page, size },
  });
  return response.data;
};

export const saveArticle = async (articleId: string): Promise<void> => {
  await apiClient.post(`/api/me/saved-articles/${articleId}`);
};

export const unsaveArticle = async (articleId: string): Promise<void> => {
  await apiClient.delete(`/api/me/saved-articles/${articleId}`);
};

export const isArticleSaved = async (articleId: string): Promise<boolean> => {
  const response = await apiClient.get<{ saved: boolean }>(
    `/api/me/saved-articles/${articleId}/status`
  );
  return response.data.saved;
};

export const getReadHistory = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<ReadHistoryResponse>> => {
  const response = await apiClient.get<PageResponse<ReadHistoryResponse>>('/api/me/read-history', {
    params: { page, size },
  });
  return response.data;
};

export const trackArticleView = async (articleId: string): Promise<void> => {
  try {
    await apiClient.post(`/api/articles/${articleId}/view`);
  } catch (error) {
    // Silent fail - view tracking is non-critical
    console.error('Failed to track article view:', error);
  }
};

// Search API Types
export interface ArticleAutocompleteResponse {
  externalId: string;
  summaryKoTitle: string;
  source: string;
  category: string;
  matchType: 'TITLE' | 'BODY';
  score: number;
}

export interface ArticleAutocompleteListResponse {
  suggestions: ArticleAutocompleteResponse[];
  totalMatches: number;
}

// Search APIs
export const searchAutocomplete = async (query: string): Promise<ArticleAutocompleteListResponse> => {
  if (!query || query.trim().length < 2) {
    return { suggestions: [], totalMatches: 0 };
  }
  const response = await apiClient.get<ArticleAutocompleteListResponse>('/api/articles/autocomplete', {
    params: { q: query.trim() },
  });
  return response.data;
};

export const searchFulltext = async (
  query: string,
  page: number = 0,
  size: number = 20
): Promise<ArticlePageResponse> => {
  const response = await apiClient.get<ArticlePageResponse>('/api/articles/search/fulltext', {
    params: { q: query.trim(), page, size },
  });
  return response.data;
};

export default apiClient;