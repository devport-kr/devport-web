import type { Article } from '../types';
import { categoryConfig, sourceConfig } from '../types';

interface HeroSectionProps {
  featuredArticles: Article[];
}

export default function HeroSection({ featuredArticles }: HeroSectionProps) {
  if (featuredArticles.length === 0) return null;

  const [mainArticle, ...sideArticles] = featuredArticles.slice(0, 3);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const ArticleMeta = ({ article }: { article: Article }) => {
    const categoryInfo = categoryConfig[article.category];
    const sourceInfo = sourceConfig[article.source];

    return (
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold ${categoryInfo.color}`}>
          {categoryInfo.label}
        </span>
        <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm flex items-center gap-2">
          <span>{sourceInfo.icon}</span>
          <span>{sourceInfo.label}</span>
        </span>
      </div>
    );
  };

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-md border-l-4 border-primary-base">
        <h1 className="text-3xl font-extrabold text-navy flex items-center gap-3">
          <span className="text-4xl">🌊</span>
          오늘의 톱 트렌드
        </h1>
      </div>

      {/* Hero Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Featured Article - Large */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-primary-light">
          <div className="aspect-video bg-gradient-to-br from-primary-base to-primary-dark flex items-center justify-center text-white text-6xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <span className="relative z-10">{categoryConfig[mainArticle.category].label.split('/')[0]}</span>
          </div>

          <div className="p-8">
            <ArticleMeta article={mainArticle} />

            <h2 className="text-3xl font-extrabold text-navy mb-4 leading-tight">
              <a
                href={mainArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-base transition-colors"
              >
                {mainArticle.summaryKoTitle}
              </a>
            </h2>

            <p className="text-gray-600 text-lg mb-4 leading-relaxed">
              {mainArticle.titleEn}
            </p>

            {mainArticle.summaryKoBody && (
              <p className="text-gray-700 mb-6 leading-relaxed">
                {mainArticle.summaryKoBody}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {mainArticle.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="bg-primary-lighter text-primary-dark px-3 py-1 rounded-md text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  🕐 {formatTimeAgo(mainArticle.createdAtSource)}
                </span>
                {mainArticle.metadata?.stars && (
                  <span>⭐ {mainArticle.metadata.stars.toLocaleString()}</span>
                )}
                {mainArticle.metadata?.comments && (
                  <span>💬 {mainArticle.metadata.comments}</span>
                )}
                {mainArticle.metadata?.readTime && (
                  <span>📖 {mainArticle.metadata.readTime}</span>
                )}
              </div>

              <a
                href={mainArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-primary-base to-primary-dark text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                원문 보기 →
              </a>
            </div>
          </div>
        </article>

        {/* Side Articles - Smaller */}
        <div className="flex flex-col gap-6">
          {sideArticles.map((article) => {
            const categoryInfo = categoryConfig[article.category];
            const sourceInfo = sourceConfig[article.source];

            return (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-light overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Icon/Category Visual */}
                  <div className={`${categoryInfo.color} flex items-center justify-center text-white text-4xl sm:w-32 h-32 sm:h-auto`}>
                    <div className="p-6">
                      {categoryInfo.label.split('/')[0]}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center gap-1">
                        <span>{sourceInfo.icon}</span>
                        <span>{sourceInfo.label}</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-navy mb-2 leading-tight">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-base transition-colors line-clamp-2"
                      >
                        {article.summaryKoTitle}
                      </a>
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.titleEn}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>🕐 {formatTimeAgo(article.createdAtSource)}</span>
                        {article.metadata?.readTime && (
                          <span>📖 {article.metadata.readTime}</span>
                        )}
                      </div>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-base hover:text-primary-dark font-semibold text-sm"
                      >
                        →
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
