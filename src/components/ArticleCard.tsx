import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { getCategoryInfo, formatReadTime } from '../types';
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
  const categoryInfo = getCategoryInfo(article.category);
  const sourceLabel = (article.source || '').trim() || 'Unknown';
  const summaryText = article.summaryKoBody
    ? stripMarkdown(article.summaryKoBody)
    : article.titleEn;
  const readTime = article.metadata?.readTime ? formatReadTime(article.metadata.readTime) : undefined;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const categoryLabel = (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${categoryInfo.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dot}`} aria-hidden="true" />
      {categoryInfo.label}
    </span>
  );

  if (variant === 'compact') {
    return (
      <Link
        to={`/articles/${article.externalId}`}
        className="block panel p-5 hover:border-surface-border-strong hover:bg-surface-hover transition-colors group"
      >
        <div className="flex items-center gap-2 mb-3 font-mono text-[11px] uppercase tracking-[0.04em] text-text-muted min-w-0">
          {categoryLabel}
          <span className="text-surface-border-strong">/</span>
          <span className="truncate">{sourceLabel}</span>
        </div>

        <h3 className="text-base font-medium text-text-primary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
          {article.summaryKoTitle}
        </h3>

        <div className="flex items-center gap-3 font-mono text-[11px] text-text-muted">
          {readTime && (
            <span className="flex items-center gap-1">
              <BookIcon className="w-3.5 h-3.5" />
              {readTime}
            </span>
          )}
          <span className="font-sans tracking-normal">{formatTimeAgo(article.createdAtSource)}</span>
        </div>
      </Link>
    );
  }

  return (
    <article className="py-6 border-b border-dashed border-surface-border-strong group -mx-4 px-4 hover:bg-surface-card/40 transition-colors">
      {/* Header: manifest line */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.04em] text-text-muted min-w-0">
          {categoryLabel}
          <span className="text-surface-border-strong">/</span>
          <span className="truncate max-w-[10rem]">{sourceLabel}</span>
          <span className="text-surface-border-strong">/</span>
          <time dateTime={article.createdAtSource} className="font-sans tracking-normal">{formatTimeAgo(article.createdAtSource)}</time>
          {readTime && (
            <>
              <span className="text-surface-border-strong">/</span>
              <span className="flex items-center gap-1">
                <BookIcon className="w-3 h-3" />
                {readTime}
              </span>
            </>
          )}
        </div>
        <BookmarkButton articleId={article.externalId} size="sm" />
      </div>

      <Link to={`/articles/${article.externalId}`} className="block">
        {/* Title */}
        <h2 className="text-[17px] font-semibold text-text-primary mb-2 leading-snug tracking-[-0.01em] group-hover:text-accent transition-colors">
          {article.summaryKoTitle}
        </h2>

        {/* Summary or English title */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
          {summaryText}
        </p>

        {/* Tags & Score */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-text-muted min-w-0">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="truncate">
                <span className="text-surface-border-strong">#</span>
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span>+{article.tags.length - 3}</span>
            )}
          </div>

          <span className="shrink-0 flex items-center gap-1 font-mono text-xs font-semibold text-signal tabular-nums" title="트렌드 점수">
            <FlameIcon className="w-3.5 h-3.5" />
            {article.score.toLocaleString()}
          </span>
        </div>
      </Link>
    </article>
  );
}
