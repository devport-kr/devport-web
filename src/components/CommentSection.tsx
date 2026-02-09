import { useState, useEffect } from 'react';
import type { CommentTreeNode } from '../types';
import {
  getCommentsByArticle,
  createComment,
  updateComment,
  deleteComment,
  type CommentResponse,
} from '../services/api';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  articleId: string;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCommentsByArticle(articleId);
      const tree = buildCommentTree(data);
      setComments(tree);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildCommentTree = (flatComments: CommentResponse[]): CommentTreeNode[] => {
    const commentMap = new Map<string, CommentTreeNode>();
    const rootComments: CommentTreeNode[] = [];

    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    flatComments.forEach((comment) => {
      const node = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(node);
        } else {
          rootComments.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    return rootComments;
  };

  const handleCreateComment = async (content: string) => {
    try {
      await createComment(articleId, { content });
      await loadComments();
    } catch (err) {
      console.error('Failed to create comment:', err);
      throw err;
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      await createComment(articleId, { content, parentCommentId: parentId });
      await loadComments();
    } catch (err) {
      console.error('Failed to create reply:', err);
      throw err;
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await updateComment(articleId, commentId, { content });
      await loadComments();
    } catch (err) {
      console.error('Failed to edit comment:', err);
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(articleId, commentId);
      await loadComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  };

  const totalCommentCount = comments.reduce((count, comment) => {
    const countReplies = (node: CommentTreeNode): number => {
      return 1 + node.replies.reduce((sum, reply) => sum + countReplies(reply), 0);
    };
    return count + countReplies(comment);
  }, 0);

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <p className="text-text-muted text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <h2 className="text-sm font-medium text-text-secondary">토론</h2>
        {totalCommentCount > 0 && (
          <span className="text-xs text-text-muted">{totalCommentCount}개 댓글</span>
        )}
      </div>

      {/* Comment form */}
      <CommentForm onSubmit={handleCreateComment} />

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-text-muted">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
