import { useState } from 'react';
import type { CommentTreeNode } from '../types';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: CommentTreeNode;
  articleId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  depth?: number;
  maxDepth?: number;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(days / 365);
  return `${years}년 전`;
};

export default function CommentItem({
  comment,
  articleId,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
  maxDepth = 5,
}: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState<-1 | 0 | 1>(0);

  const handleVote = (dir: 1 | -1) => {
    if (userVote === dir) {
      setVotes(votes - dir);
      setUserVote(0);
    } else {
      setVotes(votes - userVote + dir);
      setUserVote(dir);
    }
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setIsReplying(false);
  };

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      await onDelete(comment.id);
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const canNestMore = depth < maxDepth;

  return (
    <div>
      <div className="flex gap-0">
        {/* Thread collapse lines for nested comments */}
        {depth > 0 && (
          <div className="flex shrink-0">
            {Array.from({ length: depth }).map((_, i) => (
              <button
                key={i}
                onClick={i === depth - 1 ? () => setCollapsed(!collapsed) : undefined}
                className="w-5 flex justify-center group/line"
                aria-label="접기"
              >
                <div className={`w-px h-full transition-colors ${
                  i === depth - 1
                    ? 'bg-surface-border/60 group-hover/line:bg-accent'
                    : 'bg-surface-border/30'
                }`} />
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex gap-2">
            {/* Vote arrows */}
            <div className="flex flex-col items-center shrink-0 pt-0.5" style={{ width: '24px' }}>
              <button
                onClick={() => handleVote(1)}
                className={`p-0.5 transition-colors ${userVote === 1 ? 'text-orange-400' : 'text-text-muted/40 hover:text-orange-400'}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>
              </button>
              <span className={`text-xs font-medium leading-none my-0.5 ${
                userVote === 1 ? 'text-orange-400' : userVote === -1 ? 'text-blue-400' : 'text-text-muted'
              }`}>
                {votes === 0 ? '·' : votes > 0 ? votes : votes}
              </span>
              <button
                onClick={() => handleVote(-1)}
                className={`p-0.5 transition-colors ${userVote === -1 ? 'text-blue-400' : 'text-text-muted/40 hover:text-blue-400'}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8h-5V4H9v8H4z"/></svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              {/* Author line */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {comment.author.profileImageUrl ? (
                  <img
                    src={comment.author.profileImageUrl}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-surface-elevated flex items-center justify-center text-2xs text-text-muted">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-text-secondary">{comment.author.name}</span>
                {comment.author.flair && (
                  <span
                    className="text-2xs px-1.5 py-px rounded font-medium"
                    style={{
                      color: comment.author.flairColor || '#8b949e',
                      background: `${comment.author.flairColor || '#8b949e'}15`,
                      border: `1px solid ${comment.author.flairColor || '#8b949e'}30`,
                    }}
                  >
                    {comment.author.flair}
                  </span>
                )}
                <span className="text-2xs text-text-muted">· {formatTimeAgo(comment.createdAt)}</span>
                {comment.updatedAt !== comment.createdAt && !comment.deleted && (
                  <span className="text-2xs text-text-muted italic">수정됨</span>
                )}
              </div>

              {collapsed ? (
                <button
                  onClick={() => setCollapsed(false)}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors italic"
                >
                  [{1 + (comment.replies?.length || 0)}개 댓글 접힘]
                </button>
              ) : (
                <>
                  {/* Body */}
                  {isEditing ? (
                    <div className="mb-2">
                      <CommentForm
                        onSubmit={handleEditSubmit}
                        onCancel={() => setIsEditing(false)}
                        initialValue={comment.content}
                        placeholder="댓글을 수정하세요..."
                        submitLabel="수정"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap mb-1.5 ${
                      comment.deleted ? 'italic text-text-muted' : 'text-text-primary'
                    }`}>
                      {comment.deleted ? '[삭제된 댓글입니다]' : comment.content}
                    </div>
                  )}

                  {/* Actions bar */}
                  {!comment.deleted && !isEditing && (
                    <div className="flex items-center gap-1 -ml-1.5">
                      {canNestMore && (
                        <button
                          onClick={() => setIsReplying(!isReplying)}
                          className="text-2xs text-text-muted hover:text-text-secondary hover:bg-surface-hover px-1.5 py-1 rounded transition-colors font-medium"
                        >
                          답글
                        </button>
                      )}
                      {comment.isOwner && (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-2xs text-text-muted hover:text-text-secondary hover:bg-surface-hover px-1.5 py-1 rounded transition-colors font-medium"
                          >
                            수정
                          </button>
                          <button
                            onClick={handleDelete}
                            className="text-2xs text-text-muted hover:text-red-400 hover:bg-surface-hover px-1.5 py-1 rounded transition-colors font-medium"
                          >
                            삭제
                          </button>
                        </>
                      )}
                      <button className="text-2xs text-text-muted hover:text-text-secondary hover:bg-surface-hover px-1.5 py-1 rounded transition-colors font-medium">
                        공유
                      </button>
                      {depth === 0 && hasReplies && (
                        <button
                          onClick={() => setCollapsed(true)}
                          className="text-2xs text-text-muted hover:text-text-secondary hover:bg-surface-hover px-1.5 py-1 rounded transition-colors font-medium"
                        >
                          접기
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reply form */}
                  {isReplying && (
                    <div className="mt-3">
                      <CommentForm
                        onSubmit={handleReplySubmit}
                        onCancel={() => setIsReplying(false)}
                        placeholder="답글을 입력하세요..."
                        submitLabel="답글"
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Nested replies — shown by default */}
                  {hasReplies && (
                    <div className="mt-2">
                      {comment.replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          articleId={articleId}
                          onReply={onReply}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          depth={depth + 1}
                          maxDepth={maxDepth}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
