import apiClient from '../../lib/http/apiClient';

export interface WikiDraft {
  id: number;
  projectId: number;
  sections: Array<Record<string, unknown>>;
  currentCounters: Record<string, unknown>;
  hiddenSections: string[];
  sourcePublishedVersionId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WikiDraftUpsertPayload {
  sections: Array<Record<string, unknown>>;
  currentCounters: Record<string, unknown>;
  hiddenSections: string[];
  sourcePublishedVersionId?: number;
}

export interface WikiPublishedVersionItem {
  versionId: number;
  versionNumber: number;
  publishedFromDraftId?: number | null;
  rolledBackFromVersionId?: number | null;
  publishedAt: string;
}

export interface WikiVersionHistory {
  projectId: number;
  latestVersionNumber?: number | null;
  versions: WikiPublishedVersionItem[];
}

export interface WikiAdminProjectSummary {
  projectId: number;
  projectExternalId: string;
  fullName: string;
  stars: number;
  language: string;
  portName: string;
  portSlug: string;
}

export async function listAdminWikiProjects(): Promise<WikiAdminProjectSummary[]> {
  const response = await apiClient.get<WikiAdminProjectSummary[]>('/api/wiki/admin/projects');
  return response.data;
}

function adminProjectPath(projectId: number): string {
  return `/api/wiki/admin/projects/${projectId}`;
}

export async function listDrafts(projectId: number): Promise<WikiDraft[]> {
  const response = await apiClient.get<WikiDraft[]>(`${adminProjectPath(projectId)}/drafts`);
  return response.data;
}

export async function getDraft(projectId: number, draftId: number): Promise<WikiDraft> {
  const response = await apiClient.get<WikiDraft>(`${adminProjectPath(projectId)}/drafts/${draftId}`);
  return response.data;
}

export async function createDraft(projectId: number, payload: WikiDraftUpsertPayload): Promise<WikiDraft> {
  const response = await apiClient.post<WikiDraft>(`${adminProjectPath(projectId)}/drafts`, payload);
  return response.data;
}

export async function updateDraft(
  projectId: number,
  draftId: number,
  payload: WikiDraftUpsertPayload,
): Promise<WikiDraft> {
  const response = await apiClient.put<WikiDraft>(`${adminProjectPath(projectId)}/drafts/${draftId}`, payload);
  return response.data;
}

export async function regenerateDraft(
  projectId: number,
  draftId: number,
  payload: WikiDraftUpsertPayload,
): Promise<WikiDraft> {
  const response = await apiClient.post<WikiDraft>(
    `${adminProjectPath(projectId)}/drafts/${draftId}/regenerate`,
    payload,
  );
  return response.data;
}

export async function publishDraft(projectId: number, draftId: number): Promise<WikiVersionHistory> {
  const response = await apiClient.post<WikiVersionHistory>(`${adminProjectPath(projectId)}/publish`, {
    draftId,
  });
  return response.data;
}

export async function rollbackPublishedVersion(
  projectId: number,
  targetVersionNumber: number,
): Promise<WikiVersionHistory> {
  const response = await apiClient.post<WikiVersionHistory>(`${adminProjectPath(projectId)}/rollback`, {
    targetVersionNumber,
  });
  return response.data;
}
