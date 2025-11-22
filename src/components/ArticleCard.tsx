import type { Article } from '../types';
import { categoryConfig, sourceConfig, icons } from '../types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const categoryInfo = categoryConfig[article.category];
  const sourceInfo = sourceConfig[article.source];

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
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 text-xs flex items-center gap-1">
            <span>{sourceInfo.icon}</span>
            <span>{sourceInfo.label}</span>
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {article.summaryKoTitle}
        </h3>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="text-lg">{icons.time}</span> {formatTimeAgo(article.createdAtSource)}
            </span>
            {article.metadata?.readTime && (
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{icons.readTime}</span> {article.metadata.readTime}
              </span>
            )}
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
      className="block bg-[#1a1d29] rounded-xl overflow-hidden transition-all border border-gray-700 hover:border-blue-500/50 cursor-pointer group"
    >
      <div className="p-7">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-gray-700/50 text-gray-300 text-sm flex items-center gap-2">
            <span>{sourceInfo.icon}</span>
            <span>{sourceInfo.label}</span>
          </span>
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

        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md text-sm font-medium border border-blue-500/30"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="text-lg">{icons.time}</span> {formatTimeAgo(article.createdAtSource)}
            </span>
            {article.metadata?.stars && (
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{icons.star}</span> {article.metadata.stars.toLocaleString()} stars
              </span>
            )}
            {article.metadata?.comments && (
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{icons.comment}</span> {article.metadata.comments} comments
              </span>
            )}
            {article.metadata?.upvotes && (
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{icons.upvote}</span> {article.metadata.upvotes} upvotes
              </span>
            )}
            {article.metadata?.readTime && (
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{icons.readTime}</span> {article.metadata.readTime}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
