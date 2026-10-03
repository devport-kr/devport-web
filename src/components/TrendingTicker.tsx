import type { TrendingTickerResponse } from '../services/articles/articlesService';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface TrendingTickerProps {
  articles: TrendingTickerResponse[];
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
};

export default function TrendingTicker({ articles }: TrendingTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || articles.length === 0) return;
    // Let people who prefer reduced motion scroll it themselves
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let scrollAmount = 0;
    const scrollStep = 0.5;
    const scrollInterval = 30;

    const autoScroll = setInterval(() => {
      scrollAmount += scrollStep;
      scrollContainer.scrollLeft = scrollAmount;

      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
    }, scrollInterval);

    return () => clearInterval(autoScroll);
  }, [articles.length]);

  const duplicatedArticles = [...articles, ...articles];

  if (articles.length === 0) return null;

  return (
    <div className="flex items-stretch bg-surface-elevated/50">
      {/* Departures-board label */}
      <div className="shrink-0 flex items-center gap-2 px-4 sm:px-6 border-r border-surface-border font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-signal">
        <span className="live-dot" aria-hidden="true" />
        Live
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-w-0 flex overflow-x-auto scrollbar-hide motion-safe:overflow-x-hidden py-3.5 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-48px),transparent)]"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="flex gap-10 sm:gap-14 px-4 sm:px-6">
          {duplicatedArticles.map((article, index) => (
            <Link
              key={`${article.id}-${index}`}
              to={`/articles/${article.externalId}`}
              className="flex-shrink-0 group"
              aria-hidden={index >= articles.length ? true : undefined}
              tabIndex={index >= articles.length ? -1 : undefined}
            >
              <div className="flex items-center gap-3 min-w-[75vw] sm:min-w-[380px]">
                <time className="font-mono text-[11px] text-text-muted whitespace-nowrap tabular-nums">
                  {formatTimeAgo(article.createdAtSource)}
                </time>
                <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors line-clamp-1">
                  {article.summaryKoTitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
