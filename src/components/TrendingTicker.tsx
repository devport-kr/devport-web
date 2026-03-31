import type { Article } from '../types';
import { useEffect, useRef } from 'react';

interface TrendingTickerProps {
  articles: Article[];
}

export default function TrendingTicker({ articles }: TrendingTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || articles.length === 0) return;

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
    <div className="bg-surface-elevated/30">
      <div
        ref={scrollRef}
        className="flex overflow-x-hidden py-4"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="flex gap-8 sm:gap-12 px-4 sm:px-6">
          {duplicatedArticles.map((article, index) => (
             <a
               key={`${article.id}-${index}`}
               href={article.url}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-shrink-0 group"
             >
               <div className="flex items-center gap-4 sm:gap-6 min-w-[75vw] sm:min-w-[380px]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors line-clamp-1">
                  {article.summaryKoTitle}
                </p>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {formatTimeAgo(article.createdAtSource)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
