/**
 * WikiChatPanel - Streaming chat interface with repo-specific Q&A.
 *
 * Uses SSE (fetch + ReadableStream) via useWikiChat to progressively
 * render answer tokens, clarification chips, and suggested question chips.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWikiChat } from '../../services/wiki/useWikiChat';
import WikiMarkdownRenderer from './WikiMarkdownRenderer';
import { Maximize2, Minimize2, History, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionHistoryDrawer from './SessionHistoryDrawer';

interface WikiChatPanelProps {
  projectExternalId: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const SUGGESTION_PROMPTS = [
  '이 프로젝트는 어떤 문제를 해결하나요?',
  '핵심 아키텍처를 설명해 주세요',
  '시작하려면 어떻게 해야 하나요?',
  '최근 주요 변경 사항이 있나요?',
  '주요 기능은 무엇인가요?',
];

export default function WikiChatPanel({ projectExternalId, isExpanded, onToggleExpand }: WikiChatPanelProps) {
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
        projectExternalId={projectExternalId}
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

        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title={isExpanded ? "채팅 축소" : "채팅 넓히기"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
      </div>

      {isLoadingHistory && (
        <div className="absolute inset-0 z-50 bg-surface-card flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">이전 대화 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* Chat Messages / Empty State */}
      <div className="px-4 py-3 flex-1 min-h-[300px] overflow-y-auto space-y-3 z-0 scrollbar-minimal relative">
        {!hasMessages ? (
          <div className="flex flex-col h-full items-center justify-center -mt-6">
            {/* Logo + instruction — upper portion */}
            <div className="flex-1 flex flex-col items-center justify-center text-center relative">
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
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
                이 프로젝트에 대해 궁금한 점이 있으면
              </p>
              <p className="text-base text-text-muted leading-relaxed">
                무엇이든 질문해 보세요.
              </p>
            </div>

            {/* Suggestion chips — bottom portion */}
            <div className="shrink-0 pt-4 pb-1 space-y-2">
              <p className="text-2xs text-text-muted/50 uppercase tracking-widest font-medium mb-2">추천 질문</p>
              {SUGGESTION_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-surface-border/60 text-xs text-text-muted hover:text-text-secondary hover:border-accent/30 hover:bg-accent/5 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Session reset notice */}
            {sessionReset && (
              <div className="flex justify-center">
                <span className="text-2xs text-text-muted/70 bg-surface-elevated px-3 py-1 rounded-full border border-surface-border/40">
                  대화 기억이 초기화되었습니다.
                </span>
              </div>
            )}

            {/* Committed messages */}
            {messages.map((msg, idx) => {
              const isLast = idx === messages.length - 1;
              const showClarification =
                isLast && msg.role === 'assistant' && !isStreaming && clarificationOptions.length > 0;
              const showSuggested =
                isLast && msg.role === 'assistant' && !isStreaming && suggestedNextQuestions.length > 0;

              return (
                <div key={idx}>
                  {msg.role === 'error' ? (
                    /* Inline error bubble */
                    <div className="flex justify-start">
                      {msg.content.includes('로그인') || msg.content.includes('1번만') || msg.content.includes('무료 질문') ? (
                        <div className="max-w-[85%] bg-surface-elevated border border-accent/20 rounded-lg px-4 py-3 text-xs flex flex-col gap-3">
                          <p className="text-text-primary">
                            사용 가능한 대화를 모두 사용했습니다.
                            <br />
                            대화를 이어나가고 싶으면 로그인을 해주세요.
                          </p>
                          <Link
                            to="/login"
                            className="text-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
                          >
                            로그인
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

                  {/* Clarification chips — auto-fill and submit */}
                  {showClarification && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-0">
                      {clarificationOptions.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSend(option)}
                          className="px-3 py-1.5 rounded-full border border-accent/40 text-2xs text-accent hover:bg-accent/10 transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested next questions chips */}
                  {showSuggested && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <p className="text-2xs text-text-muted/50 uppercase tracking-widest font-medium">관련 질문</p>
                      {suggestedNextQuestions.map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleSend(q)}
                          className="text-left px-3 py-2 rounded-lg border border-surface-border/60 text-xs text-text-muted hover:text-text-secondary hover:border-accent/30 hover:bg-accent/5 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live streaming bubble */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-surface-elevated rounded-lg px-3 py-2 text-xs text-text-secondary overflow-x-auto scrollbar-minimal">
                  {streamingContent ? (
                    <div className="relative">
                      <WikiMarkdownRenderer content={streamingContent + ' ▍'} />
                    </div>
                  ) : (
                    /* Typing indicator before first token */
                    <span className="flex items-center gap-1 text-text-muted">
                      <span className="inline-block w-1 h-1 rounded-full bg-text-muted/60 animate-bounce [animation-delay:0ms]" />
                      <span className="inline-block w-1 h-1 rounded-full bg-text-muted/60 animate-bounce [animation-delay:150ms]" />
                      <span className="inline-block w-1 h-1 rounded-full bg-text-muted/60 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Network disconnect + retry */}
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
            placeholder="질문을 입력하세요..."
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
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
