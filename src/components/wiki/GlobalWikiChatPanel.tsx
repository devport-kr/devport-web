import { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalWikiChat } from '../../services/wiki/useGlobalWikiChat';
import WikiMarkdownRenderer from './WikiMarkdownRenderer';
import { History, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionHistoryDrawer from './SessionHistoryDrawer';

export default function GlobalWikiChatPanel() {
    const {
        messages,
        streamingContent,
        isStreaming,
        sessionReset,
        networkDisconnected,
        isLoadingHistory,
        sendMessage,
        cancelStream,
        retryLastMessage,
        resetSession,
        loadSession,
    } = useGlobalWikiChat();

    const [input, setInput] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, []);

    useEffect(() => {
        autoResize();
    }, [input, autoResize]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent, networkDisconnected]);

    const handleSend = useCallback(
        (text?: string) => {
            const question = text ?? input;
            if (!question.trim() || isStreaming) return;
            setInput('');
            sendMessage(question);
        },
        [input, isStreaming, sendMessage],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasMessages = messages.length > 0 || isStreaming || networkDisconnected;

    return (
        <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden h-full flex flex-col relative group">
            <SessionHistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                isGlobal={true}
                onSelectSession={loadSession}
            />

            {/* Top Header inside chat panel */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border/50 shrink-0 bg-surface-card z-10">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        title="이전 대화록"
                    >
                        <History size={14} />
                    </button>
                    <button
                        onClick={() => resetSession()}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        title="새 대화 시작"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="text-xs font-semibold text-text-secondary pr-2">
                    portki 챗봇
                </div>
            </div>

            {isLoadingHistory && (
                <div className="absolute inset-0 z-50 bg-surface-card flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={24} className="text-accent animate-spin" />
                        <p className="text-xs text-text-muted">이전 대화 불러오는 중...</p>
                    </div>
                </div>
            )}

            {/* Chat Messages / Empty State */}
            <div className="px-4 py-3 flex-1 min-h-[300px] overflow-y-auto space-y-3 z-0 scrollbar-minimal relative">
                {!hasMessages ? (
                    <div className="flex flex-col h-full items-center justify-center -mt-6">
                        {/* Logo + instruction */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center relative w-full">
                            <div
                                className="absolute inset-0 opacity-[0.04] pointer-events-none w-full"
                                style={{
                                    background: 'radial-gradient(ellipse at 50% 40%, #2f81f7 0%, transparent 70%)',
                                }}
                            />
                            <div className="mb-5 opacity-25">
                                <span className="text-5xl font-semibold text-text-muted tracking-tight">
                                    devport<span className="text-accent">.</span>
                                </span>
                            </div>
                            <p className="text-base text-text-muted leading-relaxed">
                                모든 프로젝트를 통합 검색해 드립니다.
                            </p>
                            <p className="text-base text-text-muted leading-relaxed">
                                찾으시는 기능이나 라이브러리를 질문해 보세요.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {sessionReset && (
                            <div className="flex justify-center">
                                <span className="text-2xs text-text-muted/70 bg-surface-elevated px-3 py-1 rounded-full border border-surface-border/40">
                                    대화 기억이 초기화되었습니다.
                                </span>
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            return (
                                <div key={idx} className="flex flex-col gap-2">
                                    {msg.role === 'error' ? (
                                        /* Inline error bubble */
                                        <div className="flex justify-start">
                                            {msg.content.includes('로그인') || msg.content.includes('1번만') || msg.content.includes('무료 질문') ? (
                                                <div className="max-w-[85%] bg-surface-elevated border border-accent/20 rounded-lg px-4 py-3 text-xs flex flex-col gap-3">
                                                    <p className="text-text-primary">
                                                        오늘 무료 질문을 모두 사용했습니다. 로그인하면 하루 100번까지 이용할 수 있어요.
                                                    </p>
                                                    <Link
                                                        to="/login"
                                                        className="text-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
                                                    >
                                                        로그인하기
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="max-w-[85%] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 flex items-start gap-2">
                                                    <span>⚠</span>
                                                    <span>{msg.content}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* User / assistant bubble */
                                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.role === 'user'
                                                    ? 'bg-accent/15 text-text-primary'
                                                    : 'bg-surface-elevated text-text-secondary overflow-x-auto scrollbar-minimal'
                                                    }`}
                                            >
                                                {msg.role === 'user' ? (
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                ) : (
                                                    <WikiMarkdownRenderer content={msg.content} />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Render related projects if present for assistant messages */}
                                    {msg.role === 'assistant' && msg.relatedProjects && msg.relatedProjects.length > 0 && (
                                        <div className="flex justify-start">
                                            <div className="w-full max-w-[85%] mt-1 flex flex-col gap-2">
                                                <p className="text-2xs font-bold uppercase tracking-widest text-text-muted mb-1 pl-1">추천 프로젝트</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {msg.relatedProjects.map(project => (
                                                        <Link
                                                            key={project.projectExternalId}
                                                            to={`/ports/${encodeURIComponent(project.projectExternalId)}`}
                                                            className="block p-3 rounded-lg border border-surface-border/60 bg-surface-card hover:bg-surface-elevated hover:border-accent/40 transition-colors"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="font-semibold text-sm text-accent">{project.fullName}</h4>
                                                                <span className="text-xs text-text-muted shrink-0 flex items-center gap-1">
                                                                    <span>⭐</span> {project.stars.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                                                                {project.description}
                                                            </p>
                                                            <div className="bg-surface-elevated/50 p-2 rounded text-2xs text-text-muted/90 italic">
                                                                "{project.relevanceReason}"
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isStreaming && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%] bg-surface-elevated rounded-lg px-3 py-2 text-xs text-text-secondary overflow-x-auto scrollbar-minimal">
                                    {streamingContent ? (
                                        <div className="relative">
                                            <WikiMarkdownRenderer content={streamingContent + ' ▍'} />
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-1 text-text-muted">
                                            <span className="inline-block w-1 h-1 rounded-full bg-text-muted/60 animate-bounce [animation-delay:0ms]" />
                                            <span className="inline-block w-1 h-1 rounded-full bg-text-muted/60 animate-bounce [animation-delay:150ms]" />
                                            <span className="inline-block w-1 h-1 rounded-full bg-text-muted/60 animate-bounce [animation-delay:300ms]" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {networkDisconnected && !isStreaming && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-2 bg-surface-elevated border border-surface-border/60 rounded-lg px-3 py-2 text-xs text-text-muted">
                                    <span>연결이 끊겼습니다.</span>
                                    <button
                                        type="button"
                                        onClick={retryLastMessage}
                                        className="text-accent hover:underline"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Chat Input */}
            <div className="px-4 py-3 border-t border-surface-border shrink-0">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="portki 챗봇에게 질문을 입력하세요..."
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none overflow-hidden"
                    />

                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={cancelStream}
                            className="px-3 py-2 rounded-lg bg-surface-elevated border border-surface-border/60 text-text-muted hover:text-text-secondary hover:border-surface-border transition-colors text-xs font-medium shrink-0"
                        >
                            취소
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="px-3 py-2 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium shrink-0"
                        >
                            보내기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
