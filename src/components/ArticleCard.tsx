import type { Article } from '../types';
import { categoryConfig, sourceConfig } from '../types';

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
      <article className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-light">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center gap-1">
            <span>{sourceInfo.icon}</span>
            <span>{sourceInfo.label}</span>
          </span>
        </div>

        <h3 className="text-lg font-bold text-navy mb-2 line-clamp-2 hover:text-primary-base transition-colors">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.summaryKoTitle}
          </a>
        </h3>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              🕐 {formatTimeAgo(article.createdAtSource)}
            </span>
            {article.metadata?.readTime && (
              <span>📖 {article.metadata.readTime}</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-light">
      <div className="p-7">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center gap-2">
            <span>{sourceInfo.icon}</span>
            <span>{sourceInfo.label}</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-navy mb-3 leading-tight">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-base transition-colors"
          >
            {article.summaryKoTitle}
          </a>
        </h2>

        <p className="text-gray-600 mb-4 leading-relaxed">
          {article.titleEn}
        </p>

        {article.summaryKoBody && (
          <p className="text-gray-700 mb-4 leading-relaxed">
            {article.summaryKoBody}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-primary-lighter text-primary-dark px-3 py-1 rounded-md text-sm font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              🕐 {formatTimeAgo(article.createdAtSource)}
            </span>
            {article.metadata?.stars && (
              <span>⭐ {article.metadata.stars.toLocaleString()} stars</span>
            )}
            {article.metadata?.comments && (
              <span>💬 {article.metadata.comments} comments</span>
            )}
            {article.metadata?.upvotes && (
              <span>⬆️ {article.metadata.upvotes} upvotes</span>
            )}
            {article.metadata?.readTime && (
              <span>📖 {article.metadata.readTime}</span>
            )}
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-primary-base to-primary-dark text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
          >
            원문 보기 →
          </a>
        </div>
      </div>
    </article>
  );
}
