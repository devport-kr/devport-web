import apiClient from '../../lib/http/apiClient';
import type { Port, PortDetailResponse, ProjectDetail, ProjectEvent, EventType, StarHistoryPoint, ProjectComment, ProjectOverview } from '../../types';
import type { SpringPageResponse } from '../llm/llmService';

// ─── Ports & Projects APIs ───────────────────────────────────────

export const getPorts = async (): Promise<Port[]> => {
  const response = await apiClient.get<Port[]>('/api/ports');
  return response.data;
};

export const getPortBySlug = async (slug: string): Promise<PortDetailResponse> => {
  const response = await apiClient.get<PortDetailResponse>(`/api/ports/${slug}`);
  return response.data;
};

export const getProjectById = async (id: string): Promise<ProjectDetail> => {
  const response = await apiClient.get<ProjectDetail>(`/api/projects/${id}`);
  return response.data;
};

export const getProjectEvents = async (
  projectId: string,
  type?: EventType,
  page: number = 0,
  size: number = 20
): Promise<SpringPageResponse<ProjectEvent>> => {
  const response = await apiClient.get<SpringPageResponse<ProjectEvent>>(
    `/api/projects/${projectId}/events`,
    {
      params: { type, page, size },
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
    `/api/projects/${projectId}/star-history`,
    {
      params: { from, to },
    }
  );
  return response.data;
};

export const getProjectOverview = async (projectId: string): Promise<ProjectOverview> => {
  const response = await apiClient.get<ProjectOverview>(`/api/projects/${projectId}/overview`);
  return response.data;
};

// ─── Project Comments APIs ───────────────────────────────────────

export const getProjectComments = async (projectId: string): Promise<ProjectComment[]> => {
  const response = await apiClient.get<ProjectComment[]>(`/api/projects/${projectId}/comments`);
  return response.data;
};

export const createProjectComment = async (
  projectId: string,
  content: string,
  parentCommentId?: string
): Promise<ProjectComment> => {
  const response = await apiClient.post<ProjectComment>(`/api/projects/${projectId}/comments`, {
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
    `/api/projects/${projectId}/comments/${commentId}`,
    { content }
  );
  return response.data;
};

export const deleteProjectComment = async (
  projectId: string,
  commentId: string
): Promise<void> => {
  await apiClient.delete(`/api/projects/${projectId}/comments/${commentId}`);
};

export const voteOnProjectComment = async (
  projectId: string,
  commentId: string,
  vote: 1 | -1 | 0
): Promise<{ votes: number; userVote: 0 | 1 | -1 }> => {
  const response = await apiClient.post<{ votes: number; userVote: 0 | 1 | -1 }>(
    `/api/projects/${projectId}/comments/${commentId}/vote`,
    { vote }
  );
  return response.data;
};
