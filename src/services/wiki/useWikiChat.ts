/**
 * useWikiChat — React hook for streaming wiki chat sessions.
 *
 * State:
 *   messages          — committed history (user + assistant turns)
 *   streamingContent  — live token accumulation while streaming
 *   isStreaming       — true while a stream is open
 *   error             — last error message, null when clear
 *   clarificationOptions   — chips to show when isClarification is true
 *   suggestedNextQuestions — chips to show after a regular answer
 *   sessionReset      — true when the server signals session expiry
 *
 * Actions:
 *   sendMessage(question)  — aborts any in-flight stream, then streams the new question
 *   cancelStream()         — aborts current stream and resets streaming state
 *   clearError()           — clear error state
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { streamWikiChat } from './wikiChatStream';
import { chatSessionsApi } from './chatSessions';
import { ensureAccessToken } from '../../lib/http/authRefresh';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type UseChatOptions = {
    projectId: string;
};

export function useWikiChat({ projectId }: UseChatOptions) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clarificationOptions, setClarificationOptions] = useState<string[]>([]);
    const [suggestedNextQuestions, setSuggestedNextQuestions] = useState<string[]>([]);
    const [sessionReset, setSessionReset] = useState(false);
    const [networkDisconnected, setNetworkDisconnected] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const STORAGE_KEY = `wiki-session:${projectId}`;
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
    // Keep track of the last question so the caller can retry on network failure
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
    }, [projectId, loadHistory]);

    const sendMessage = useCallback(
        async (question: string) => {
            if (!question.trim()) return;

            // Abort any in-flight stream before starting a new one
            abortControllerRef.current?.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            lastQuestionRef.current = question.trim();

            setMessages(prev => [...prev, { role: 'user', content: question.trim() }]);
            setStreamingContent('');
            setIsStreaming(true);
            setError(null);
            setClarificationOptions([]);
            setSuggestedNextQuestions([]);
            setSessionReset(false);
            setNetworkDisconnected(false);

            let accumulated = '';

            try {
                await streamWikiChat(
                    projectId,
                    question.trim(),
                    sessionIdRef.current,
                    {
                        onToken(token) {
                            accumulated += token;
                            setStreamingContent(accumulated);
                        },
                        onDone(payload) {
                            // Commit the streamed message to history
                            setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
                            setStreamingContent('');
                            setIsStreaming(false);

                            // Update session ID (echo from server — good hygiene)
                            sessionIdRef.current = payload.sessionId;

                            if (payload.sessionReset) {
                                setSessionReset(true);
                            }
                            if (payload.isClarification) {
                                setClarificationOptions(payload.clarificationOptions);
                            } else if (payload.suggestedNextQuestions.length > 0) {
                                setSuggestedNextQuestions(payload.suggestedNextQuestions);
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
                // streamWikiChat only throws on unexpected network disconnect (non-abort)
                if (!controller.signal.aborted) {
                    setStreamingContent('');
                    setIsStreaming(false);
                    setNetworkDisconnected(true);
                }
            }
        },
        [projectId],
    );

    const cancelStream = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsStreaming(false);
        setStreamingContent('');
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /** Retry the last question after a network disconnect */
    const retryLastMessage = useCallback(() => {
        if (lastQuestionRef.current) {
            // Remove the failed user message that was already appended
            setMessages(prev => prev.slice(0, -1));
            setNetworkDisconnected(false);
            sendMessage(lastQuestionRef.current);
        }
    }, [sendMessage]);

    /** Start a brand-new session (resets history and generates a new session ID) */
    const resetSession = useCallback(() => {
        abortControllerRef.current?.abort();
        const newId = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, newId);
        sessionIdRef.current = newId;
        setMessages([]);
        setStreamingContent('');
        setIsStreaming(false);
        setError(null);
        setClarificationOptions([]);
        setSuggestedNextQuestions([]);
        setSessionReset(false);
        setNetworkDisconnected(false);
    }, [STORAGE_KEY]);

    /** Load an existing session */
    const loadSession = useCallback(async (sessionId: string) => {
        abortControllerRef.current?.abort();
        localStorage.setItem(STORAGE_KEY, sessionId);
        sessionIdRef.current = sessionId;
        setStreamingContent('');
        setIsStreaming(false);
        setError(null);
        setClarificationOptions([]);
        setSuggestedNextQuestions([]);
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
        clarificationOptions,
        suggestedNextQuestions,
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
