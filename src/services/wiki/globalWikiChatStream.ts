import { authenticatedFetch } from '../../lib/http/authenticatedFetch';
import { parseSSEMessage, type StreamCallbacks } from './wikiChatStream';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface WikiGlobalChatResponse {
    answer: string;
    relatedProjects: {
        projectExternalId: string;
        fullName: string;
        description: string;
        relevanceReason: string;
        stars: number;
    }[];
    hasRelatedProjects: boolean;
    sessionId: string;
}

export type GlobalStreamDonePayload = WikiGlobalChatResponse & {
    sessionReset?: boolean;
};

export type GlobalStreamCallbacks = Omit<StreamCallbacks, 'onDone'> & {
    onDone: (payload: GlobalStreamDonePayload) => void;
};

export async function streamGlobalWikiChat(
    question: string,
    sessionId: string,
    callbacks: GlobalStreamCallbacks,
    signal?: AbortSignal,
): Promise<void> {
    const url = `${API_BASE_URL}/api/wiki/chat/stream`;

    let response: Response;
    try {
        response = await authenticatedFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify({ question, sessionId }),
            signal,
        });
    } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        callbacks.onError('네트워크 오류가 발생했습니다.');
        return;
    }

    if (!response.ok) {
        let message = '알 수 없는 오류가 발생했습니다.';
        try {
            const body = await response.json();
            if (typeof body?.message === 'string') message = body.message;
        } catch {
            // ignore
        }
        callbacks.onError(message);
        return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const messages = buffer.split('\n\n');
            buffer = messages.pop() ?? '';

            for (const message of messages) {
                parseSSEMessage(message, callbacks as unknown as StreamCallbacks);
            }
        }
    } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        throw err;
    }

    if (buffer.trim()) {
        parseSSEMessage(buffer, callbacks as unknown as StreamCallbacks);
    }
}
