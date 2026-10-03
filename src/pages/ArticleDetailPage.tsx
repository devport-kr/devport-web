import { useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import TrendingTicker from '../components/TrendingTicker';
import CommentSection from '../components/CommentSection';
import BookmarkButton from '../components/BookmarkButton';
import { getArticleByExternalId, getTrendingTicker, trackArticleView, type ArticleDetailResponse } from '../services/articles/articlesService';
import { getCategoryInfo } from '../types';
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
          <div className="lg:ml-52 border-b border-surface-border">
            <TrendingTicker articles={tickerArticles} />
          </div>

          {/* Error content */}
          <main className="lg:ml-52 pt-8 pb-8 px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-16">
                <p className="label-mono">Error 404</p>
                <h1 className="mt-2 text-2xl font-semibold text-text-primary mb-3">아티클을 찾을 수 없습니다</h1>
                <p className="text-text-secondary mb-8">{error || '삭제되었거나 주소가 잘못되었을 수 있습니다.'}</p>
                <Link to="/" className="btn btn-primary">
                  ← 홈으로 돌아가기
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(article.category);
  const sourceLabel = (article.source || '').trim() || 'Unknown';

  const metaItems: { label: string; value: string; icon?: ReactNode; highlight?: boolean }[] = [
    { label: 'Score', value: article.score.toLocaleString(), icon: <FlameIcon className="w-3.5 h-3.5" />, highlight: true },
  ];
  if (article.metadata?.stars) {
    metaItems.push({ label: 'Stars', value: article.metadata.stars.toLocaleString(), icon: <StarIcon className="w-3.5 h-3.5" /> });
  }
  if (article.metadata?.comments) {
    metaItems.push({ label: 'Comments', value: article.metadata.comments.toLocaleString(), icon: <MessageIcon className="w-3.5 h-3.5" /> });
  }
  if (article.metadata?.upvotes) {
    metaItems.push({ label: 'Upvotes', value: article.metadata.upvotes.toLocaleString(), icon: <ThumbsUpIcon className="w-3.5 h-3.5" /> });
  }
  if (article.metadata?.readTime) {
    metaItems.push({ label: 'Read', value: article.metadata.readTime.replace(' read', ''), icon: <BookIcon className="w-3.5 h-3.5" /> });
  }
  metaItems.push({ label: 'Published', value: formatDate(article.createdAtSource) });

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* Trending Ticker - with left margin to avoid left sidebar */}
        <div className="lg:ml-52 border-b border-surface-border">
          <TrendingTicker articles={tickerArticles} />
        </div>

        {/* Center - Article Content */}
        <main className="lg:ml-52 pt-8 pb-8 px-8">
          <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted hover:text-text-primary transition-colors mb-8"
            >
              ← 목록으로
            </Link>

            {/* Article header */}
            <header className="mb-10">
              {/* Manifest line: category / source / time + bookmark */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.04em] text-text-muted min-w-0">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${categoryInfo.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dot}`} aria-hidden="true" />
                    {categoryInfo.label}
                  </span>
                  <span className="text-surface-border-strong">/</span>
                  <span className="truncate">{sourceLabel}</span>
                  <span className="text-surface-border-strong">/</span>
                  <time dateTime={article.createdAtSource}>{formatTimeAgo(article.createdAtSource)}</time>
                </div>
                <BookmarkButton articleId={article.externalId} size="lg" showLabel />
              </div>

              {/* Title */}
              <h1 className="text-[1.625rem] md:text-[2rem] font-semibold text-text-primary leading-snug tracking-[-0.02em] mb-3">
                {article.summaryKoTitle}
              </h1>

              {/* English title */}
              <p className="text-[15px] text-text-muted leading-relaxed mb-6">
                {article.titleEn}
              </p>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-6 font-mono text-xs text-text-muted">
                  {article.tags.map((tag) => (
                    <span key={tag}>
                      <span className="text-surface-border-strong">#</span>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata manifest */}
              <dl className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-surface-border">
                {metaItems
                  .map((item) => (
                    <div key={item.label} className="px-4 py-3 border-r border-b border-surface-border">
                      <dt className="label-mono">{item.label}</dt>
                      <dd className={`mt-1 flex items-center gap-1.5 font-mono text-sm tabular-nums ${item.highlight ? 'text-signal font-semibold' : 'text-text-primary'}`}>
                        {item.icon}
                        {item.value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </header>

            {/* Article body */}
            <article className="article-body mb-10">
              <Markdown>{article.summaryKoBody}</Markdown>
            </article>

            {/* Original link */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 border-y border-dashed border-surface-border-strong">
              <div className="min-w-0">
                <p className="label-mono">Source</p>
                <p className="mt-1 text-sm text-text-secondary truncate">{sourceLabel}</p>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg shrink-0"
              >
                원문 보기
                <ArrowUpRight className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
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