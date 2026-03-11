import api from '../../lib/http/apiClient';

export interface WikiSession {
    sessionId: string;
    title: string | null;
    sessionType: 'PROJECT' | 'GLOBAL';
    projectExternalId: string | null;
    createdAt: string;
    lastMessageAt: string;
    messageCount: number;
}

export interface WikiSessionListResponse {
    sessions: WikiSession[];
    totalPages: number;
    totalElements: number;
    page: number;
    size: number;
}

export interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    isClarification?: boolean;
    createdAt: string;
}

export const chatSessionsApi = {
    /** Fetch paginated list of all sessions */
    getAllSessions: async (page = 0, size = 20): Promise<WikiSessionListResponse> => {
        const res = await api.get('/api/wiki/sessions', {
            params: { page, size },
            skipAuthRedirect: true,
        } as any);
        return res.data;
    },

    /** Fetch paginated list of sessions for a specific project */
    getProjectSessions: async (projectExternalId: string, page = 0, size = 20): Promise<WikiSessionListResponse> => {
        const res = await api.get(`/api/wiki/sessions/project`, {
            params: { externalId: projectExternalId, page, size },
            skipAuthRedirect: true,
        } as any);
        return res.data;
    },

    /** Fetch paginated list of global sessions */
    getGlobalSessions: async (page = 0, size = 20): Promise<WikiSessionListResponse> => {
        const res = await api.get('/api/wiki/sessions/global', {
            params: { page, size },
            skipAuthRedirect: true,
        } as any);
        return res.data;
    },

    /** Delete a specific session */
    deleteSession: async (sessionId: string): Promise<void> => {
        await api.delete(`/api/wiki/sessions/${sessionId}`, {
            skipAuthRedirect: true,
        } as any);
    },

    /** Fetch message history for a session */
    getSessionMessages: async (sessionId: string): Promise<ChatHistoryMessage[]> => {
        const res = await api.get(`/api/wiki/sessions/${sessionId}/messages`, {
            skipAuthRedirect: true,
        } as any);
        return res.data;
    }
};
