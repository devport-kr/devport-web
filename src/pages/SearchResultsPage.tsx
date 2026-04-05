import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { searchFulltext } from '../services/search/searchService';
import type { Article } from '../types';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageSize = 20;

  // Load initial results when query changes
  useEffect(() => {
    const loadResults = async () => {
      if (!query || query.trim().length < 2) {
        setError('검색어를 2자 이상 입력해주세요.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setArticles([]);
      setPage(0);

      try {
        const response = await searchFulltext(query, 0, pageSize);
        setArticles(response.content);
        setHasMore(response.hasMore);
        setTotalResults(response.totalElements);
      } catch (err) {
        console.error('Search error:', err);
        setError('검색 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query]);

  // Load more results
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await searchFulltext(query, nextPage, pageSize);
      setArticles((prev) => [...prev, ...response.content]);
      setHasMore(response.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500 &&
        hasMore &&
        !loadingMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, page, query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            검색 결과
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">검색어:</span>
            <span className="text-accent font-medium">{query}</span>
            {!loading && totalResults > 0 && (
              <>
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">
                  총 {totalResults.toLocaleString()}개
                </span>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 text-text-muted mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-text-secondary">{error}</p>
            <Link
              to="/"
              className="inline-block mt-4 text-accent hover:text-accent-light transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && articles.length === 0 && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 text-text-muted mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-lg font-medium text-text-primary mb-2">
              검색 결과가 없습니다
            </p>
            <p className="text-sm text-text-muted">
              다른 검색어로 다시 시도해보세요
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && articles.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && articles.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">
                  모든 검색 결과를 확인했습니다
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer className="pb-16 lg:pb-0" />
    </div>
  );
}
