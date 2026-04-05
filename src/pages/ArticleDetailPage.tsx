import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import TrendingTicker from '../components/TrendingTicker';
import CommentSection from '../components/CommentSection';
import BookmarkButton from '../components/BookmarkButton';
import { getArticleByExternalId, getTrendingTicker, trackArticleView, type ArticleDetailResponse } from '../services/articles/articlesService';
import type { Category } from '../types';
import { categoryConfig } from '../types';
import StarIcon from '../components/icons/StarIcon';
import MessageIcon from '../components/icons/MessageIcon';
import ThumbsUpIcon from '../components/icons/ThumbsUpIcon';
import BookIcon from '../components/icons/BookIcon';
import FlameIcon from '../components/icons/FlameIcon';

export default function ArticleDetailPage() {
  const { externalId } = useParams<{ externalId: string }>();
  const [article, setArticle] = useState<ArticleDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickerArticles, setTickerArticles] = useState<any[]>([]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [externalId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!externalId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [articleData, tickerData] = await Promise.all([
          getArticleByExternalId(externalId),
          getTrendingTicker(),
        ]);

        setArticle(articleData);
        setTickerArticles(tickerData);

        // Track article view for authenticated users
        if (externalId) {
          trackArticleView(externalId);
        }
      } catch (err) {
        console.error('Failed to fetch article:', err);
        setError('아티클을 찾을 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [externalId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-glow">
        <Navbar />
        <div className="min-h-[calc(100vh-4rem)]">
          {/* Left Sidebar - Fixed */}
          <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
            <Sidebar />
          </div>

          {/* Loading spinner */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-glow">
        <Navbar />
        <div className="min-h-[calc(100vh-4rem)]">
          {/* Left Sidebar - Fixed */}
          <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
            <Sidebar />
          </div>

          {/* Trending Ticker */}
          <div className="lg:ml-52 border-b border-surface-border/50">
            <TrendingTicker articles={tickerArticles} />
          </div>

          {/* Error content */}
          <main className="lg:ml-52 pt-8 pb-8 px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-16">
                <h1 className="text-2xl font-bold text-text-primary mb-4">404</h1>
                <p className="text-text-secondary mb-8">{error || '아티클을 찾을 수 없습니다.'}</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  홈으로 돌아가기
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const categoryInfo = categoryConfig[article.category as Category];
  const sourceLabel = (article.source || '').trim() || 'Unknown';

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* Trending Ticker - with left margin to avoid left sidebar */}
        <div className="lg:ml-52 border-b border-surface-border/50">
          <TrendingTicker articles={tickerArticles} />
        </div>

        {/* Center - Article Content */}
        <main className="lg:ml-52 pt-8 pb-8 px-8">
          <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              목록으로
            </Link>

            {/* Article header */}
            <header className="mb-8">
              {/* Category & Source & Bookmark */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white ${categoryInfo?.color || 'bg-gray-600'}`}>
                    {categoryInfo?.label || article.category}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="text-sm text-text-muted capitalize">{sourceLabel}</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-sm text-text-muted">{formatTimeAgo(article.createdAtSource)}</span>
                </div>
                <BookmarkButton articleId={article.externalId} size="lg" showLabel />
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4 leading-tight">
                {article.summaryKoTitle}
              </h1>

              {/* English title */}
              <p className="text-lg text-text-secondary mb-6">
                {article.titleEn}
              </p>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm text-text-muted px-3 py-1 rounded-full bg-surface-hover"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted pb-6 border-b border-surface-border">
                <span className="flex items-center gap-1.5 text-accent">
                  <FlameIcon className="w-4 h-4" />
                  {article.score.toLocaleString()} 점수
                </span>
                {article.metadata?.stars && (
                  <span className="flex items-center gap-1.5">
                    <StarIcon className="w-4 h-4" />
                    {article.metadata.stars.toLocaleString()} stars
                  </span>
                )}
                {article.metadata?.comments && (
                  <span className="flex items-center gap-1.5">
                    <MessageIcon className="w-4 h-4" />
                    {article.metadata.comments} comments
                  </span>
                )}
                {article.metadata?.upvotes && (
                  <span className="flex items-center gap-1.5">
                    <ThumbsUpIcon className="w-4 h-4" />
                    {article.metadata.upvotes} upvotes
                  </span>
                )}
                {article.metadata?.readTime && (
                  <span className="flex items-center gap-1.5">
                    <BookIcon className="w-4 h-4" />
                    {article.metadata.readTime}
                  </span>
                )}
                <span className="text-text-muted">
                  {formatDate(article.createdAtSource)}
                </span>
              </div>
            </header>

            {/* Article body */}
            <article className="prose prose-invert prose-lg max-w-none mb-8">
              <div className="text-text-primary leading-relaxed [&>p]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>li]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-text-secondary [&>code]:bg-surface-hover [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-surface-elevated [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>a]:text-accent [&>a]:hover:underline">
                <Markdown>{article.summaryKoBody}</Markdown>
              </div>
            </article>

            {/* Original link */}
            <div className="flex justify-center pt-6 border-t border-surface-border">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
              >
                원문 보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Comment Section */}
            <div className="mt-12">
              <CommentSection articleId={article.externalId} />
            </div>
          </div>
        </main>
      </div>

      <Footer className="lg:ml-52" />
    </div>
  );
}