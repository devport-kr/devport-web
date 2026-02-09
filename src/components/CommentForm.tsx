import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export default function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = '댓글을 입력하세요...',
  submitLabel = '작성',
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(autoFocus);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
      setIsFocused(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3 px-1">
        <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-2xs text-text-muted shrink-0">
          ?
        </div>
        <a
          href="/login"
          className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-text-muted hover:border-surface-border transition-colors cursor-pointer"
        >
          로그인하고 토론에 참여하세요
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start gap-3 px-1">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="w-6 h-6 rounded-full shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-2xs text-text-muted shrink-0 mt-0.5">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            rows={isFocused || content ? 3 : 1}
            className="w-full bg-surface-elevated/50 border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 transition-all resize-none"
            autoFocus={autoFocus}
          />
          {(isFocused || content) && (
            <div className="flex justify-end gap-2 mt-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={() => { onCancel(); setIsFocused(false); }}
                  className="text-xs text-text-muted hover:text-text-secondary px-3 py-1.5 rounded transition-colors"
                  disabled={isSubmitting}
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="text-xs font-medium bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : submitLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
