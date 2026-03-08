/**
 * Wiki chat streaming service.
 * Uses fetch() + ReadableStream to consume SSE from POST /api/wiki/projects/chat/stream.
 * EventSource is NOT used because the endpoint requires a POST body and Authorization header.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export type StreamDonePayload = {
    sessionId: string;
    isClarification: boolean;
    clarificationOptions: string[];
    suggestedNextQuestions: string[];
    sessionReset: boolean;
};

export type StreamCallbacks = {
    onToken: (token: string) => void;
    onDone: (payload: StreamDonePayload) => void;
    onError: (message: string) => void;
};

/**
 * Open an SSE stream for wiki chat and forward events to callbacks.
 *
 * Rate-limit (429) and auth (401) errors return before any stream data —
 * those are surfaced via onError. Mid-stream exceptions arrive as `error` SSE events.
 *
 * @param projectId   Project external ID (e.g. "github:owner/repo")
 * @param question    User question (max 1 000 chars)
 * @param sessionId   Client-generated UUID — reuse across turns in the same conversation
 * @param callbacks   Token / done / error handlers
 * @param signal      Optional AbortSignal to cancel the stream
 */
export async function streamWikiChat(
    projectId: string,
    question: string,
    sessionId: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
): Promise<void> {
    // Query-param variant avoids double-encoding issues for IDs containing "/"
    const url = `${API_BASE_URL}/api/wiki/projects/chat/stream?id=${encodeURIComponent(projectId)}`;
    const accessToken = localStorage.getItem('accessToken') ?? '';

    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                Accept: 'text/event-stream',
            },
            body: JSON.stringify({ question, sessionId }),
            signal,
        });
    } catch (err) {
        // Fetch itself failed (network error or aborted)
        if ((err as Error)?.name === 'AbortError') return;
        callbacks.onError('네트워크 오류가 발생했습니다.');
        return;
    }

    // HTTP-level errors arrive synchronously before any stream data
    if (!response.ok) {
        let message = '알 수 없는 오류가 발생했습니다.';
        try {
            const body = await response.json();
            if (typeof body?.message === 'string') message = body.message;
        } catch {
            // ignore parse failure
        }

        if (response.status === 429) {
            // Daily / per-minute rate limit messages come from the API
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

            // SSE messages are delimited by double newline
            const messages = buffer.split('\n\n');
            buffer = messages.pop() ?? '';

            for (const message of messages) {
                parseSSEMessage(message, callbacks);
            }
        }
    } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // Stream ended without a `done` event — caller shows retry UI
        throw err;
    }

    // Flush any trailing data that arrived without a final double-newline
    if (buffer.trim()) {
        parseSSEMessage(buffer, callbacks);
    }
}

/**
 * Parse a single SSE message block (everything between two `\n\n` delimiters).
 * Exported for unit-testing purposes.
 */
export function parseSSEMessage(raw: string, callbacks: StreamCallbacks): void {
    let eventName = 'message';
    let data = '';

    for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
            // SSE spec: one optional space after "data:" is a delimiter — the rest is payload.
            // Do NOT .trim() — leading/trailing whitespace in the payload is significant for tokens.
            data = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
        }
    }

    if (!data) return;

    switch (eventName) {
        case 'token':
            if (data) {
                let token = data;
                try {
                    // Backend sends tokens as JSON strings to preserve whitespace/newlines safely
                    const parsed = JSON.parse(data);
                    if (typeof parsed === 'string') {
                        token = parsed;
                    }
                } catch {
                    // Fall back to legacy plain text token
                }
                callbacks.onToken(token);
            }
            break;
        case 'done':
            try {
                callbacks.onDone(JSON.parse(data) as StreamDonePayload);
            } catch {
                callbacks.onError('스트림 완료 데이터를 파싱하지 못했습니다.');
            }
            break;
        case 'error':
            try {
                const parsed = JSON.parse(data) as { message?: string };
                callbacks.onError(parsed.message ?? '처리 중 오류가 발생했습니다.');
            } catch {
                callbacks.onError('처리 중 오류가 발생했습니다.');
            }
            break;
        // 'message' and unknown event names are silently ignored
    }
}
