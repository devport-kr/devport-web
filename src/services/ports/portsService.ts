import apiClient from '../../lib/http/apiClient';
import type { ProjectDetail, ProjectEvent, EventType, StarHistoryPoint, ProjectComment, ProjectOverview } from '../../types';
import type { SpringPageResponse } from '../llm/llmService';

// ─── Project APIs ─────────────────────────────────────────────────

export const getProjectById = async (id: string): Promise<ProjectDetail> => {
  // Use query param to avoid encoded-slash issues with github:owner/repo IDs
  const response = await apiClient.get<ProjectDetail>(`/api/projects`, { params: { id } });
  return response.data;
};

export const getProjectEvents = async (
  projectId: string,
  type?: EventType,
  page: number = 0,
  size: number = 20
): Promise<SpringPageResponse<ProjectEvent>> => {
  // Use query param to avoid encoded-slash issues with github:owner/repo IDs
  const response = await apiClient.get<SpringPageResponse<ProjectEvent>>(
    `/api/projects/events`,
    {
      params: { id: projectId, type, page, size },
    }
  );
  return response.data;
};

export const getProjectStarHistory = async (
  projectId: string,
  from?: string,
  to?: string
): Promise<StarHistoryPoint[]> => {
  const response = await apiClient.get<StarHistoryPoint[]>(
    `/api/projects/${encodeURIComponent(projectId)}/star-history`,
    {
      params: { from, to },
    }
  );
  return response.data;
};

export const getProjectOverview = async (projectId: string): Promise<ProjectOverview> => {
  const response = await apiClient.get<ProjectOverview>(`/api/projects/${encodeURIComponent(projectId)}/overview`);
  return response.data;
};

// ─── Project Comments APIs ───────────────────────────────────────

export const getProjectComments = async (projectId: string): Promise<ProjectComment[]> => {
  // Use query param to avoid encoded-slash issues with github:owner/repo IDs
  const response = await apiClient.get<ProjectComment[]>(`/api/projects/comments`, { params: { projectId } });
  return response.data;
};

export const createProjectComment = async (
  projectId: string,
  content: string,
  parentCommentId?: string
): Promise<ProjectComment> => {
  const response = await apiClient.post<ProjectComment>(`/api/projects/${encodeURIComponent(projectId)}/comments`, {
    content,
    parentCommentId,
  });
  return response.data;
};

export const updateProjectComment = async (
  projectId: string,
  commentId: string,
  content: string
): Promise<ProjectComment> => {
  const response = await apiClient.put<ProjectComment>(
    `/api/projects/${encodeURIComponent(projectId)}/comments/${commentId}`,
    { content }
  );
  return response.data;
};

export const deleteProjectComment = async (
  projectId: string,
  commentId: string
): Promise<void> => {
  await apiClient.delete(`/api/projects/${encodeURIComponent(projectId)}/comments/${commentId}`);
};

export const voteOnProjectComment = async (
  projectId: string,
  commentId: string,
  vote: 1 | -1 | 0
): Promise<{ votes: number; userVote: 0 | 1 | -1 }> => {
  const response = await apiClient.post<{ votes: number; userVote: 0 | 1 | -1 }>(
    `/api/projects/${encodeURIComponent(projectId)}/comments/${commentId}/vote`,
    { vote }
  );
  return response.data;
};
