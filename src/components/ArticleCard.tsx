import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { categoryConfig } from '../types';
import StarIcon from './icons/StarIcon';
import MessageIcon from './icons/MessageIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import BookIcon from './icons/BookIcon';
import FlameIcon from './icons/FlameIcon';
import BookmarkButton from './BookmarkButton';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact';
}

const stripMarkdown = (markdown: string) => {
  const plainText = markdown
    // remove fenced code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // inline code
    .replace(/`[^`]*`/g, '')
    // images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // headings #### Title -> Title
    .replace(/^#{1,6}\s*/gm, '')
    // blockquotes
    .replace(/^\s*>+\s?/gm, '')
    // unordered lists
    .replace(/^\s*[-*+]\s+/gm, '')
    // ordered lists
    .replace(/^\s*\d+\.\s+/gm, '')
    // emphasis/bold/strikethrough
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // collapse whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText || markdown;
};

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const categoryInfo = categoryConfig[article.category];
  const sourceLabel = (article.source || '').trim() || 'Unknown';
  const summaryText = article.summaryKoBody
    ? stripMarkdown(article.summaryKoBody)
    : article.titleEn;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/articles/${article.externalId}`}
        className="block bg-surface-card rounded-xl p-5 border border-surface-border hover:border-surface-border/80 hover:bg-surface-hover transition-all group"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xs font-medium uppercase tracking-wider text-text-muted">
            {categoryInfo.label}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-2xs text-text-muted">{sourceLabel}</span>
        </div>

        <h3 className="text-base font-medium text-text-primary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
          {article.summaryKoTitle}
        </h3>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          {article.metadata?.readTime && (
            <span className="flex items-center gap-1">
              <BookIcon className="w-3.5 h-3.5" />
              {article.metadata.readTime.replace(' read', '')}
            </span>
          )}
          <span>{formatTimeAgo(article.createdAtSource)}</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="block py-6 border-b border-surface-border hover:bg-surface-card/30 transition-all group -mx-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-accent">
            {categoryInfo.label}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-xs text-text-muted">
            {sourceLabel}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-xs text-text-muted">{formatTimeAgo(article.createdAtSource)}</span>
          {article.metadata?.readTime && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <BookIcon className="w-3 h-3" />
                {article.metadata.readTime.replace(' read', '')}
              </span>
            </>
          )}
        </div>
        <BookmarkButton articleId={article.externalId} size="sm" />
      </div>

      <Link to={`/articles/${article.externalId}`}>

      {/* Title */}
      <h2 className="text-lg font-semibold text-text-primary mb-2 leading-snug group-hover:text-accent transition-colors">
        {article.summaryKoTitle}
      </h2>

      {/* Summary or English title */}
      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
        {summaryText}
      </p>

      {/* Tags & Stats */}
      <div className="flex items-center justify-between">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-hover"
            >
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="text-xs text-text-muted px-2 py-0.5">
              +{article.tags.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="relative flex items-center gap-3 text-xs text-text-muted group/stats">
          <span className="flex items-center gap-1 text-accent">
            <FlameIcon className="w-3.5 h-3.5" />
            {article.score.toLocaleString()}
          </span>
          {article.metadata?.stars && (
            <span className="flex items-center gap-1">
              <StarIcon className="w-3.5 h-3.5" />
              {article.metadata.stars.toLocaleString()}
            </span>
          )}
          {article.metadata?.comments && (
            <span className="flex items-center gap-1">
              <MessageIcon className="w-3.5 h-3.5" />
              {article.metadata.comments}
            </span>
          )}
          {article.metadata?.upvotes && (
            <span className="flex items-center gap-1">
              <ThumbsUpIcon className="w-3.5 h-3.5" />
              {article.metadata.upvotes}
            </span>
          )}
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg opacity-0 group-hover/stats:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
            <p className="text-xs text-text-secondary">점수는 조회수·반응·댓글·날짜 정보를 반영한 점수 입니다</p>
            <p className="text-xs text-text-secondary">댓글과 좋아요 수는 해당 출처에서 집계된 값입니다</p>
          </div>
        </div>
      </div>
      </Link>
    </div>
  );
}
