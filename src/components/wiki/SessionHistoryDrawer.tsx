import { useCallback, useEffect, useState } from 'react';
import { chatSessionsApi, type WikiSession } from '../../services/wiki/chatSessions';
import { X, Trash2, MessageSquare, Loader2 } from 'lucide-react';

interface SessionHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSession: (sessionId: string) => void;
    projectExternalId?: string;
    isGlobal?: boolean;
}

export default function SessionHistoryDrawer({
    isOpen,
    onClose,
    onSelectSession,
    projectExternalId,
    isGlobal
}: SessionHistoryDrawerProps) {
    const [sessions, setSessions] = useState<WikiSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const fetchSessions = useCallback(async (pageNum: number) => {
        setIsLoading(true);
        try {
            let res;
            if (isGlobal) {
                res = await chatSessionsApi.getGlobalSessions(pageNum, 20);
            } else if (projectExternalId) {
                res = await chatSessionsApi.getProjectSessions(projectExternalId, pageNum, 20);
            } else {
                res = await chatSessionsApi.getAllSessions(pageNum, 20);
            }

            if (pageNum === 0) {
                setSessions(res.sessions);
            } else {
                setSessions(prev => [...prev, ...res.sessions]);
            }

            setHasMore(res.page < res.totalPages - 1);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load sessions', err);
        } finally {
            setIsLoading(false);
        }
    }, [isGlobal, projectExternalId]);

    useEffect(() => {
        if (isOpen) {
            fetchSessions(0);
        }
    }, [isOpen, fetchSessions]);

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!window.confirm('이 대화 기록을 삭제하시겠습니까?')) return;

        try {
            await chatSessionsApi.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));

            // If we deleted the active session, clear local storage
            const storageKey = isGlobal ? 'wiki-session:global' : `wiki-session:${projectExternalId}`;
            if (localStorage.getItem(storageKey) === sessionId) {
                localStorage.removeItem(storageKey);
            }
        } catch (err) {
            console.error('Failed to delete session', err);
            alert('삭제에 실패했습니다.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-y-0 left-0 w-64 bg-surface-card border-r border-surface-border z-40 flex flex-col shadow-xl transition-transform duration-200">
            <div className="flex items-center justify-between p-3 border-b border-surface-border shrink-0">
                <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                    <MessageSquare size={14} className="text-accent" />
                    이전 대화록
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 block scrollbar-minimal">
                {isLoading && page === 0 ? (
                    <div className="flex justify-center p-4">
                        <Loader2 size={16} className="text-accent animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center p-4 text-xs text-text-muted">
                        이전 대화가 없습니다.
                    </div>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.sessionId}
                            onClick={() => {
                                onSelectSession(session.sessionId);
                                onClose();
                            }}
                            className="flex items-center justify-between group p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-surface-border/50"
                        >
                            <div className="min-w-0 pr-2">
                                <p className="text-xs text-text-secondary font-medium truncate">
                                    {session.title ?? `${session.sessionId.slice(0, 8)}...`}
                                </p>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                    {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                                </p>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, session.sessionId)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                                title="삭제"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}

                {hasMore && (
                    <button
                        onClick={() => fetchSessions(page + 1)}
                        disabled={isLoading}
                        className="w-full py-2 mt-2 text-xs text-text-muted hover:text-accent disabled:opacity-50"
                    >
                        {isLoading ? '불러오는 중...' : '더 보기'}
                    </button>
                )}
            </div>
        </div>
    );
}
