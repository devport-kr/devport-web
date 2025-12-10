import type { Article } from '../types';
import { categoryConfig } from '../types';
import StarIcon from './icons/StarIcon';
import MessageIcon from './icons/MessageIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import BookIcon from './icons/BookIcon';
import FlameIcon from './icons/FlameIcon';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const categoryInfo = categoryConfig[article.category];
  const sourceLabel = (article.source || '').trim() || 'Unknown';

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
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#1a1d29] rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer"
      >
        <div className="flex items-center flex-wrap gap-2 mb-3" onClickCapture={(e) => e.stopPropagation()}>
          <span
            className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}
          >
            {categoryInfo.label}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 text-xs">
            {sourceLabel}
          </span>
          {article.metadata?.readTime && (
            <span className="px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 text-xs flex items-center gap-1.5">
              <BookIcon className="w-3 h-3" />
              <span>{article.metadata.readTime.replace(' read', '')}</span>
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {article.summaryKoTitle}
        </h3>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{formatTimeAgo(article.createdAtSource)}</span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#1a1d29] rounded-xl overflow-hidden transition-all border border-gray-700 hover:border-blue-500/50 cursor-pointer group h-full"
    >
      <div className="p-7 h-full flex flex-col">
        <div className="flex items-center flex-wrap gap-2 mb-4" onClickCapture={(e) => e.stopPropagation()}>
          <span className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-gray-700/50 text-gray-300 text-sm">
            {sourceLabel}
          </span>
          {article.metadata?.readTime && (
            <span className="px-4 py-1.5 rounded-full bg-gray-700/50 text-gray-300 text-sm flex items-center gap-2">
              <BookIcon className="w-4 h-4" />
              <span>{article.metadata.readTime.replace(' read', '')}</span>
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors">
          {article.summaryKoTitle}
        </h2>

        <p className="text-gray-400 mb-4 leading-relaxed">
          {article.titleEn}
        </p>

        {article.summaryKoBody && (
          <p className="text-gray-300 mb-4 leading-relaxed">
            {article.summaryKoBody}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4" onClickCapture={(e) => e.stopPropagation()}>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md text-sm font-medium border border-blue-500/30"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-700 relative group/metadata">
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <FlameIcon className="w-4 h-4" />
              {article.score.toLocaleString()} 점
            </span>
            {article.metadata?.stars && (
              <span className="flex items-center gap-1.5">
                <StarIcon className="w-4 h-4" />
                {article.metadata.stars.toLocaleString()}
              </span>
            )}
            {article.metadata?.comments && (
              <span className="flex items-center gap-1.5">
                <MessageIcon className="w-4 h-4" />
                {article.metadata.comments}
              </span>
            )}
            {article.metadata?.upvotes && (
              <span className="flex items-center gap-1.5">
                <ThumbsUpIcon className="w-4 h-4" />
                {article.metadata.upvotes}
              </span>
            )}
            <span>{formatTimeAgo(article.createdAtSource)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500 opacity-0 transition-opacity group-hover/metadata:opacity-100 space-y-0.5">
            <span className="block">불꽃 점수는 조회수·반응·댓글·날짜 정보를 반영한 점수 입니다.</span>
            <span className="block">댓글과 좋아요 수는 해당 출처 혹은 Reddit에서 집계된 값입니다.</span>
          </p>
        </div>
      </div>
    </a>
  );
}
