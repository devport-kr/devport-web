import { useCallback, useEffect, useRef, useState } from 'react';
import { streamGlobalWikiChat, type WikiGlobalChatResponse } from './globalWikiChatStream';
import { chatSessionsApi } from './chatSessions';
import { ensureAccessToken } from '../../lib/http/authRefresh';

export type GlobalChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    relatedProjects?: WikiGlobalChatResponse['relatedProjects'];
};

export function useGlobalWikiChat() {
    const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionReset, setSessionReset] = useState(false);
    const [networkDisconnected, setNetworkDisconnected] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const STORAGE_KEY = `wiki-session:global`;
    const getOrCreateSessionId = () => {
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    };

    const sessionIdRef = useRef<string>(getOrCreateSessionId());
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastQuestionRef = useRef<string>('');

    const loadHistory = useCallback(async (sessionId: string) => {
        const token = await ensureAccessToken();
        if (!token) {
            setMessages([]);
            return;
        }

        try {
            const history = await chatSessionsApi.getSessionMessages(sessionId);
            setMessages(history.map(msg => ({
                role: msg.role,
                content: msg.content
            })));
        } catch (err) {
            console.error('Failed to load chat history:', err);
            setMessages([]);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const initHistory = async () => {
            setIsLoadingHistory(true);
            await loadHistory(sessionIdRef.current);
            if (mounted) setIsLoadingHistory(false);
        };
        initHistory();
        return () => { mounted = false; };
    }, [loadHistory]);

    const sendMessage = useCallback(
        async (question: string) => {
            if (!question.trim()) return;

            abortControllerRef.current?.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            lastQuestionRef.current = question.trim();

            setMessages(prev => [...prev, { role: 'user', content: question.trim() }]);
            setStreamingContent('');
            setIsStreaming(true);
            setError(null);
            setSessionReset(false);
            setNetworkDisconnected(false);

            let accumulated = '';

            try {
                await streamGlobalWikiChat(
                    question.trim(),
                    sessionIdRef.current,
                    {
                        onToken(token) {
                            accumulated += token;
                            setStreamingContent(accumulated);
                        },
                        onDone(payload) {
                            setMessages(prev => [
                                ...prev,
                                {
                                    role: 'assistant',
                                    content: payload.answer || accumulated,
                                    relatedProjects: payload.hasRelatedProjects ? payload.relatedProjects : undefined
                                }
                            ]);
                            setStreamingContent('');
                            setIsStreaming(false);

                            sessionIdRef.current = payload.sessionId;

                            if (payload.sessionReset) {
                                setSessionReset(true);
                            }
                        },
                        onError(message) {
                            setError(message);
                            setStreamingContent('');
                            setIsStreaming(false);
                        },
                    },
                    controller.signal,
                );
            } catch {
                if (!controller.signal.aborted) {
                    setStreamingContent('');
                    setIsStreaming(false);
                    setNetworkDisconnected(true);
                }
            }
        },
        [],
    );

    const cancelStream = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsStreaming(false);
        setStreamingContent('');
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const retryLastMessage = useCallback(() => {
        if (lastQuestionRef.current) {
            setMessages(prev => prev.slice(0, -1));
            setNetworkDisconnected(false);
            sendMessage(lastQuestionRef.current);
        }
    }, [sendMessage]);

    const resetSession = useCallback(() => {
        abortControllerRef.current?.abort();
        const newId = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, newId);
        sessionIdRef.current = newId;
        setMessages([]);
        setStreamingContent('');
        setIsStreaming(false);
        setError(null);
        setSessionReset(false);
        setNetworkDisconnected(false);
    }, [STORAGE_KEY]);

    const loadSession = useCallback(async (sessionId: string) => {
        abortControllerRef.current?.abort();
        localStorage.setItem(STORAGE_KEY, sessionId);
        sessionIdRef.current = sessionId;
        setStreamingContent('');
        setIsStreaming(false);
        setError(null);
        setSessionReset(false);
        setNetworkDisconnected(false);
        setIsLoadingHistory(true);
        await loadHistory(sessionId);
        setIsLoadingHistory(false);
    }, [STORAGE_KEY, loadHistory]);

    return {
        messages,
        streamingContent,
        isStreaming,
        error,
        sessionReset,
        networkDisconnected,
        isLoadingHistory,
        sendMessage,
        cancelStream,
        clearError,
        retryLastMessage,
        resetSession,
        loadSession,
    };
}
