/**
 * PortsChatPage – Dedicated full-page chat for mobile.
 *
 * Routes:
 *   /ports/chat          → global portki chat
 *   /ports/chat/:id      → project-specific chat
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWikiChat } from '../services/wiki/useWikiChat';
import { useGlobalWikiChat } from '../services/wiki/useGlobalWikiChat';
import WikiMarkdownRenderer from '../components/wiki/WikiMarkdownRenderer';
import SessionHistoryDrawer from '../components/wiki/SessionHistoryDrawer';
import Navbar from '../components/Navbar';
import { History, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Suggestion prompts                                                 */
/* ------------------------------------------------------------------ */

const PROJECT_SUGGESTIONS = [
  '이 프로젝트는 어떤 문제를 해결하나요?',
  '핵심 아키텍처를 설명해 주세요',
  '시작하려면 어떻게 해야 하나요?',
  '최근 주요 변경 사항이 있나요?',
  '주요 기능은 무엇인가요?',
];

const GLOBAL_SUGGESTIONS = [
  '최근 인기 있는 AI 프로젝트를 추천해 주세요',
  'React 상태 관리 라이브러리 비교해 줘',
  '빠른 API 서버를 만들 수 있는 프레임워크 알려줘',
];

/* ------------------------------------------------------------------ */
/*  Project Chat                                                       */
/* ------------------------------------------------------------------ */

function ProjectChat({ projectExternalId }: { projectExternalId: string }) {
  const {
    messages,
    streamingContent,
    isStreaming,
    clarificationOptions,
    suggestedNextQuestions,
    sessionReset,
    networkDisconnected,
    sendMessage,
    cancelStream,
    retryLastMessage,
    isLoadingHistory,
    loadSession,
    resetSession,
  } = useWikiChat({ projectId: projectExternalId });

  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottom = useRef(true);
  const isProgrammaticScroll = useRef(false);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 300);
  }, []);

  const handleChatScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isUserNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (isUserNearBottom.current) {
      isProgrammaticScroll.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const t = window.setTimeout(() => { isProgrammaticScroll.current = false; }, 350);
      return () => window.clearTimeout(t);
    }
  }, [messages, streamingContent, networkDisconnected]);

  // Recalculate isUserNearBottom when the scroll container resizes (e.g. keyboard open/close
  // changes clientHeight on mobile without firing an onScroll event).
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let prevClientHeight = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const newH = el.clientHeight;
      const wasNearBottom = isUserNearBottom.current;
      isUserNearBottom.current = el.scrollHeight - el.scrollTop - newH < 100;
      if (newH > prevClientHeight && wasNearBottom) {
        isProgrammaticScroll.current = true;
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        window.setTimeout(() => { isProgrammaticScroll.current = false; }, 50);
      }
      prevClientHeight = newH;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const question = text ?? input;
      if (!question.trim() || isStreaming) return;
      isUserNearBottom.current = true;
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
    <div className="flex flex-col h-full relative">
      <SessionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projectExternalId={projectExternalId}
        onSelectSession={loadSession}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border/50 shrink-0 bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="이전 대화록"
          >
            <History size={16} />
          </button>
          <button
            onClick={() => resetSession()}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="새 대화 시작"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-sm font-semibold text-text-primary">Portki Chat</p>
        <div className="w-[88px]" /> {/* spacer to center title */}
      </div>

      {/* Chat messages */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-text-muted">이전 대화 불러오는 중...</p>
          </div>
        </div>
      ) : !hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="mb-6 opacity-20">
            <span className="text-4xl font-semibold text-text-muted tracking-tight">
              devport<span className="text-accent">.</span>
            </span>
          </div>
          <p className="text-base text-text-muted text-center leading-relaxed mb-1">
            이 프로젝트에 대해 궁금한 점이 있으면
          </p>
          <p className="text-base text-text-muted text-center leading-relaxed mb-8">
            무엇이든 질문해 보세요.
          </p>
          <div className="w-full max-w-sm space-y-2">
            <p className="text-2xs text-text-muted/50 uppercase tracking-widest font-medium mb-2 text-center">추천 질문</p>
            {PROJECT_SUGGESTIONS.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="w-full text-left px-4 py-3 rounded-xl border border-surface-border/60 text-sm text-text-muted hover:text-text-secondary hover:border-accent/30 hover:bg-accent/5 transition-all active:scale-[0.98]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-minimal">
          {sessionReset && (
            <div className="flex justify-center">
              <span className="text-2xs text-text-muted/70 bg-surface-elevated px-3 py-1 rounded-full border border-surface-border/40">
                대화 기억이 초기화되었습니다.
              </span>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const showClarification = isLast && msg.role === 'assistant' && !isStreaming && clarificationOptions.length > 0;
            const showSuggested = isLast && msg.role === 'assistant' && !isStreaming && suggestedNextQuestions.length > 0;

            return (
              <div key={idx} className="flex flex-col gap-2">
                {msg.role === 'error' ? (
                  <div className="flex justify-start">
                    {msg.content.includes('로그인') || msg.content.includes('1번만') || msg.content.includes('무료 질문') ? (
                      <div className="max-w-[90%] bg-surface-elevated border border-accent/20 rounded-xl px-4 py-3 text-sm flex flex-col gap-3">
                        <p className="text-text-primary">
                          사용 가능한 대화를 모두 사용했습니다.<br />로그인을 해주세요.
                        </p>
                        <Link to="/login" className="text-center px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium">
                          로그인
                        </Link>
                      </div>
                    ) : (
                      <div className="max-w-[90%] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                        <span>⚠</span><span>{msg.content}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent/15 text-text-primary rounded-tr-md'
                        : 'bg-surface-elevated text-text-secondary overflow-x-auto scrollbar-minimal rounded-tl-md'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <WikiMarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                )}

                {showClarification && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {clarificationOptions.map(option => (
                      <button key={option} type="button" onClick={() => handleSend(option)}
                        className="px-3.5 py-2 rounded-full border border-accent/40 text-xs text-accent hover:bg-accent/10 active:scale-[0.97] transition-all">
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {showSuggested && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <p className="text-2xs text-text-muted/50 uppercase tracking-widest font-medium">관련 질문</p>
                    {suggestedNextQuestions.map(q => (
                      <button key={q} type="button" onClick={() => handleSend(q)}
                        className="text-left px-4 py-2.5 rounded-xl border border-surface-border/60 text-sm text-text-muted hover:text-text-secondary hover:border-accent/30 hover:bg-accent/5 active:scale-[0.98] transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-surface-elevated rounded-2xl rounded-tl-md px-4 py-3 text-sm text-text-secondary overflow-x-auto scrollbar-minimal">
                {streamingContent ? (
                  <WikiMarkdownRenderer content={streamingContent + ' ▍'} />
                ) : (
                  <span className="flex items-center gap-1.5 text-text-muted py-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:0ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:150ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          )}

          {networkDisconnected && !isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-surface-elevated border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-text-muted">
                <span>연결이 끊겼습니다.</span>
                <button type="button" onClick={retryLastMessage} className="text-accent hover:underline font-medium">다시 시도</button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="px-4 pt-3 border-t border-surface-border/50 shrink-0 bg-surface/95 backdrop-blur-sm"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none overflow-hidden"
          />
          {isStreaming ? (
            <button type="button" onClick={cancelStream}
              className="px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border/60 text-text-muted hover:text-text-secondary transition-colors text-sm font-medium shrink-0">
              취소
            </button>
          ) : (
            <button type="button" onClick={() => handleSend()} disabled={!input.trim()}
              className="p-3 rounded-xl bg-accent text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Global Chat                                                        */
/* ------------------------------------------------------------------ */

function GlobalChat() {
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

  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottom = useRef(true);
  const isProgrammaticScroll = useRef(false);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 300);
  }, []);

  const handleChatScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isUserNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (isUserNearBottom.current) {
      isProgrammaticScroll.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const t = window.setTimeout(() => { isProgrammaticScroll.current = false; }, 350);
      return () => window.clearTimeout(t);
    }
  }, [messages, streamingContent, networkDisconnected]);

  // Recalculate isUserNearBottom when the scroll container resizes (e.g. keyboard open/close
  // changes clientHeight on mobile without firing an onScroll event).
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let prevClientHeight = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const newH = el.clientHeight;
      const wasNearBottom = isUserNearBottom.current;
      isUserNearBottom.current = el.scrollHeight - el.scrollTop - newH < 100;
      if (newH > prevClientHeight && wasNearBottom) {
        isProgrammaticScroll.current = true;
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        window.setTimeout(() => { isProgrammaticScroll.current = false; }, 50);
      }
      prevClientHeight = newH;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const question = text ?? input;
      if (!question.trim() || isStreaming) return;
      isUserNearBottom.current = true;
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
    <div className="flex flex-col h-full relative">
      <SessionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isGlobal={true}
        onSelectSession={loadSession}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border/50 shrink-0 bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="이전 대화록"
          >
            <History size={16} />
          </button>
          <button
            onClick={() => resetSession()}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="새 대화 시작"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-sm font-semibold text-text-primary">
          <span className="text-accent">💡</span> portki 챗봇
        </p>
        <div className="w-[88px]" />
      </div>

      {/* Chat messages */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-text-muted">이전 대화 불러오는 중...</p>
          </div>
        </div>
      ) : !hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="mb-6 opacity-20">
            <span className="text-4xl font-semibold text-text-muted tracking-tight">
              devport<span className="text-accent">.</span>
            </span>
          </div>
          <p className="text-base text-text-muted text-center leading-relaxed mb-1">
            모든 프로젝트를 통합 검색해 드립니다.
          </p>
          <p className="text-base text-text-muted text-center leading-relaxed mb-8">
            찾으시는 기능이나 라이브러리를 질문해 보세요.
          </p>
          <div className="w-full max-w-sm space-y-2">
            <p className="text-2xs text-text-muted/50 uppercase tracking-widest font-medium mb-2 text-center">추천 질문</p>
            {GLOBAL_SUGGESTIONS.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="w-full text-left px-4 py-3 rounded-xl border border-surface-border/60 text-sm text-text-muted hover:text-text-secondary hover:border-accent/30 hover:bg-accent/5 transition-all active:scale-[0.98]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-minimal">
          {sessionReset && (
            <div className="flex justify-center">
              <span className="text-2xs text-text-muted/70 bg-surface-elevated px-3 py-1 rounded-full border border-surface-border/40">
                대화 기억이 초기화되었습니다.
              </span>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              {msg.role === 'error' ? (
                <div className="flex justify-start">
                  {msg.content.includes('로그인') || msg.content.includes('1번만') || msg.content.includes('무료 질문') ? (
                    <div className="max-w-[90%] bg-surface-elevated border border-accent/20 rounded-xl px-4 py-3 text-sm flex flex-col gap-3">
                      <p className="text-text-primary">오늘 무료 질문을 모두 사용했습니다. 로그인하면 더 이용할 수 있어요.</p>
                      <Link to="/login" className="text-center px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium">로그인하기</Link>
                    </div>
                  ) : (
                    <div className="max-w-[90%] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                      <span>⚠</span><span>{msg.content}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent/15 text-text-primary rounded-tr-md'
                      : 'bg-surface-elevated text-text-secondary overflow-x-auto scrollbar-minimal rounded-tl-md'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <WikiMarkdownRenderer content={msg.content} />
                    )}
                  </div>
                </div>
              )}

              {/* Related projects */}
              {msg.role === 'assistant' && msg.relatedProjects && msg.relatedProjects.length > 0 && (
                <div className="flex justify-start">
                  <div className="w-full max-w-[90%] mt-1 flex flex-col gap-2">
                    <p className="text-2xs font-bold uppercase tracking-widest text-text-muted mb-1 pl-1">추천 프로젝트</p>
                    {msg.relatedProjects.map((project: any) => (
                      <Link key={project.projectExternalId} to={`/ports/${encodeURIComponent(project.projectExternalId)}`}
                        className="block p-3 rounded-xl border border-surface-border/60 bg-surface-card hover:bg-surface-elevated hover:border-accent/40 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm text-accent">{project.fullName}</h4>
                          <span className="text-xs text-text-muted shrink-0">⭐ {project.stars?.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">{project.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-surface-elevated rounded-2xl rounded-tl-md px-4 py-3 text-sm text-text-secondary overflow-x-auto scrollbar-minimal">
                {streamingContent ? (
                  <WikiMarkdownRenderer content={streamingContent + ' ▍'} />
                ) : (
                  <span className="flex items-center gap-1.5 text-text-muted py-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:0ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:150ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/60 animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          )}

          {networkDisconnected && !isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-surface-elevated border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-text-muted">
                <span>연결이 끊겼습니다.</span>
                <button type="button" onClick={retryLastMessage} className="text-accent hover:underline font-medium">다시 시도</button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="px-4 pt-3 border-t border-surface-border/50 shrink-0 bg-surface/95 backdrop-blur-sm"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="portki에게 질문하세요..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none overflow-hidden"
          />
          {isStreaming ? (
            <button type="button" onClick={cancelStream}
              className="px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border/60 text-text-muted hover:text-text-secondary transition-colors text-sm font-medium shrink-0">
              취소
            </button>
          ) : (
            <button type="button" onClick={() => handleSend()} disabled={!input.trim()}
              className="p-3 rounded-xl bg-accent text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page shell                                                         */
/* ------------------------------------------------------------------ */

export default function PortsChatPage() {
  const params = useParams<{ '*': string }>();
  const rawParam = params['*'] || '';

  const decodedProjectId = useMemo(() => {
    if (!rawParam) return undefined;
    try { return decodeURIComponent(rawParam); }
    catch { return rawParam; }
  }, [rawParam]);

  const isGlobal = !decodedProjectId;

  return (
    <div className="h-[100dvh] bg-glow flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-0">
        {isGlobal ? <GlobalChat /> : <ProjectChat projectExternalId={decodedProjectId!} />}
      </div>
    </div>
  );
}
