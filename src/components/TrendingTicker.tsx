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
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const scrollStep = 1; // pixels per frame
    const scrollInterval = 30; // ms between frames

    const autoScroll = setInterval(() => {
      scrollAmount += scrollStep;
      scrollContainer.scrollLeft = scrollAmount;

      // Reset to beginning when we reach the end
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
    }, scrollInterval);

    return () => clearInterval(autoScroll);
  }, []);

  // Duplicate articles for infinite scroll effect
  const duplicatedArticles = [...articles, ...articles];

  return (
    <div className="bg-primary-base shadow-lg mb-8 overflow-hidden rounded-lg">
      <div
        ref={scrollRef}
        className="flex overflow-x-hidden py-5"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="flex gap-6 px-6 animate-scroll">
          {duplicatedArticles.map((article, index) => (
            <a
              key={`${article.id}-${index}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 group cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-[400px] hover:opacity-80 transition-opacity">
                <div className="flex-1">
                  <p className="text-base font-semibold text-white group-hover:text-primary-lighter transition-colors line-clamp-1">
                    {article.summaryKoTitle}
                  </p>
                </div>
                <span className="text-sm text-white/80 whitespace-nowrap">
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
