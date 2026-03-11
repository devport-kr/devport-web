/**
 * ──────────────────────────────────────────────────────────────────
 * COMPATIBILITY FACADE — Re-export Only
 * ──────────────────────────────────────────────────────────────────
 * This file exists solely for backward compatibility. It re-exports
 * all functions and types from domain modules so existing consumer
 * imports (`from '../services/api'`) continue to work.
 *
 * DO NOT add new endpoint logic here. New endpoints must be added
 * in the appropriate domain module:
 *
 *   src/services/auth/authService.ts        — auth, OAuth, profile
 *   src/services/articles/articlesService.ts — articles, git repos
 *   src/services/articles/commentsService.ts — article comments
 *   src/services/search/searchService.ts    — autocomplete, fulltext
 *   src/services/me/meService.ts            — saved articles, history
 *   src/services/llm/llmService.ts          — LLM benchmarks, media
 *   src/services/ports/portsService.ts      — projects
 *   src/services/admin/adminService.ts      — admin CRUD operations
 *
 * Once all consumers are migrated to direct domain imports, this
 * file can be removed.
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Auth ────────────────────────────────────────────────────────
export {
  getCurrentUser,
  initiateOAuthLogin,
  logout,
  signup,
  login,
  exchangeOAuthCode,
  resendVerification,
  updateProfile,
  changePassword,
  removeEmail,
} from './auth/authService';
export type {
  UserResponse,
  SignupRequest,
  LoginRequest,
  AccessTokenResponse,
  SignupResponse,
  OAuthExchangeRequest,
  ResendVerificationRequest,
  ProfileUpdateRequest,
  PasswordChangeRequest,
} from './auth/authService';

// ─── Articles ────────────────────────────────────────────────────
export {
  getArticles,
  getArticleByExternalId,
  getTrendingTicker,
  getGitHubTrending,
  getGitRepos,
  getTrendingGitRepos,
  getTrendingGitReposPaginated,
  getGitReposByLanguage,
  getTopWeeklyGitRepos,
  trackArticleView,
} from './articles/articlesService';
export type {
  ArticlePageResponse,
  GitRepoPageResponse,
  TrendingTickerResponse,
  ArticleDetailResponse,
} from './articles/articlesService';

// ─── Comments ────────────────────────────────────────────────────
export {
  getCommentsByArticle,
  createComment,
  updateComment,
  deleteComment,
} from './articles/commentsService';
export type {
  CommentAuthorResponse,
  CommentResponse,
  CommentCreateRequest,
  CommentUpdateRequest,
} from './articles/commentsService';

// ─── Search ──────────────────────────────────────────────────────
export {
  searchAutocomplete,
  searchFulltext,
} from './search/searchService';
export type {
  ArticleAutocompleteResponse,
  ArticleAutocompleteListResponse,
} from './search/searchService';

// ─── My Page ─────────────────────────────────────────────────────
export {
  getSavedArticles,
  saveArticle,
  unsaveArticle,
  isArticleSaved,
  getReadHistory,
} from './me/meService';
export type {
  SavedArticleResponse,
  ReadHistoryResponse,
  PageResponse,
} from './me/meService';

// ─── LLM ─────────────────────────────────────────────────────────
export {
  getLLMLeaderboard,
  getAllLLMBenchmarks,
  getLLMBenchmarksByGroup,
  getLLMModelById,
  getLLMMediaLeaderboard,
} from './llm/llmService';
export type {
  LLMModelSummaryResponse,
  LLMModelDetailResponse,
  LLMLeaderboardEntryResponse,
  LLMBenchmarkResponse,
  MediaModelCreatorResponse,
  MediaModelCategoryResponse,
  LLMMediaModelResponse,
  LLMMediaType,
  SpringPageResponse,
} from './llm/llmService';

// ─── Projects ────────────────────────────────────────────────
export {
  getProjectById,
  getProjectEvents,
  getProjectStarHistory,
  getProjectOverview,
  getProjectComments,
  createProjectComment,
  updateProjectComment,
  deleteProjectComment,
  voteOnProjectComment,
} from './ports/portsService';

// ─── Admin ───────────────────────────────────────────────────────
export {
  adminCreateArticle,
  adminUpdateArticle,
  adminDeleteArticle,
  adminProcessArticleWithLLM,
  adminPreviewArticleLLM,
  adminListArticles,
  adminCreateGitRepo,
  adminUpdateGitRepo,
  adminDeleteGitRepo,
  adminCreateLLMModel,
  adminUpdateLLMModel,
  adminDeleteLLMModel,
  adminCreateModelCreator,
  adminUpdateModelCreator,
  adminDeleteModelCreator,
  adminCreateBenchmark,
  adminUpdateBenchmark,
  adminDeleteBenchmark,
} from './admin/adminService';
export type {
  CreateArticleRequest,
  CreateGitRepoRequest,
  CreateLLMModelRequest,
  CreateModelCreatorRequest,
  CreateLLMBenchmarkRequest,
  ArticleLLMCreateRequest,
  ArticleLLMPreviewResponse,
} from './admin/adminService';

// ─── Default export: shared HTTP client ──────────────────────────
export { default } from '../lib/http/apiClient';
