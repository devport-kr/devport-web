/**
 * WikiChatPanel - Chat interface with repo-specific Q&A.
 * Uses short-lived session memory and handles clarification requests.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../../lib/http/apiClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  needsClarification?: boolean;
}

interface WikiChatPanelProps {
  projectExternalId: string;
}

const SUGGESTION_PROMPTS = [
  '이 프로젝트는 어떤 문제를 해결하나요?',
  '핵심 아키텍처를 설명해 주세요',
  '비슷한 프로젝트와 비교하면?',
  '시작하려면 어떻게 해야 하나요?',
  '최근 주요 변경 사항이 있나요?',
  '프로덕션에서 사용해도 될까요?',
];

export default function WikiChatPanel({ projectExternalId }: WikiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim()) return;

    const currentSessionId = sessionId ?? crypto.randomUUID();
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    const userMessage: ChatMessage = { role: 'user', content: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post(`/api/wiki/projects/${encodeURIComponent(projectExternalId)}/chat`, {
        question: userMessage.content,
        sessionId: currentSessionId,
        includeCitations: false,
      }, {
        skipAuthRedirect: true,
      } as any);

      const data = response.data;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        needsClarification: data.isClarification || false,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const message = (error as any)?.response?.data?.message;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: message || '요청 처리 중 오류가 발생했습니다.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden h-full flex flex-col">
      {/* Chat Messages / Empty State */}
      <div className="px-4 py-3 flex-1 min-h-0 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full">
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
              {SUGGESTION_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-surface-border/60 text-xs text-text-muted hover:text-text-secondary hover:border-accent/30 hover:bg-accent/5 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                    msg.role === 'user'
                      ? 'bg-accent/15 text-text-primary'
                      : 'bg-surface-elevated text-text-secondary'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.needsClarification && (
                    <p className="text-2xs text-text-muted mt-2 italic">
                      더 자세한 내용을 알려주시면 정확하게 답변드릴 수 있어요.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-elevated rounded-lg px-3 py-2">
                  <span className="text-xs text-text-muted">생각하는 중...</span>
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
            disabled={loading}
            rows={1}
            className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none overflow-hidden"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
