import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrendingTicker from '../components/TrendingTicker';
import ArticleCard from '../components/ArticleCard';
import { getArticles, getTrendingTicker } from '../services/articles/articlesService';
import type { Article, Category } from '../types';
import { usePageMeta } from '../lib/seo';

export default function HomePage() {
  usePageMeta({});
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [articles, setArticles] = useState<Article[]>([]);
  const [tickerArticles, setTickerArticles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const articlesData = await getArticles(selectedCategory === 'ALL' ? undefined : selectedCategory, 0, 9);

        setArticles(articlesData.content);
        setHasMore(articlesData.hasMore);
        setCurrentPage(0);
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedCategory]);

  // The ticker request is several MB, so the feed renders without waiting for it
  useEffect(() => {
    getTrendingTicker()
      .then(setTickerArticles)
      .catch((error) => console.error('Failed to fetch trending ticker:', error));
  }, []);

  const fetchMoreArticles = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;

      const data = await getArticles(
        selectedCategory === 'ALL' ? undefined : selectedCategory,
        nextPage,
        9
      );

      setArticles((prev) => [...prev, ...data.content]);
      setHasMore(data.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to fetch more articles:', error);
    } finally {
      setIsLoading(false);
      setShowLoadingSpinner(false);
    }
  }, [isLoading, hasMore, currentPage, selectedCategory]);

  useEffect(() => {
    if (isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          // Show loading spinner immediately for better UX
          setShowLoadingSpinner(true);

          // Clear any pending timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          // Add a small delay (500ms) to debounce rapid scroll events
          scrollTimeoutRef.current = setTimeout(() => {
            fetchMoreArticles();
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      // Clean up timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [hasMore, isLoading, fetchMoreArticles, isInitialLoading]);

  const categories = [
    { id: 'ALL' as const, label: '전체' },
    { id: 'AI_LLM' as const, label: 'AI/LLM' },
    { id: 'DEVOPS_SRE' as const, label: 'DevOps' },
    { id: 'INFRA_CLOUD' as const, label: 'Cloud' },
    { id: 'DATABASE' as const, label: 'Database' },
    { id: 'SECURITY' as const, label: 'Security' },
    { id: 'FRONTEND' as const, label: 'Frontend' },
    { id: 'BACKEND' as const, label: 'Backend' },
    { id: 'MOBILE' as const, label: 'Mobile' },
    { id: 'OTHER' as const, label: '기타' },
  ];

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        {/* Trending Ticker */}
        <div className="border-b border-surface-border/50">
          <TrendingTicker articles={tickerArticles} />
        </div>

        {/* Articles */}
        <main className="px-4 md:px-8 pt-8 pb-24 lg:pb-8">
          <div className="max-w-2xl mx-auto">
            {/* Page heading for search engines and screen readers; the feed is the visual header */}
            <h1 className="sr-only">devport · 해외 개발 트렌드를 한국어로</h1>
            {/* Articles Section */}
            <section>
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(category.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-accent text-white'
                        : 'text-text-muted hover:text-text-secondary hover:bg-surface-card'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Article List */}
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="h-10" />

              {/* Loading Indicator */}
              {(isLoading || showLoadingSpinner) && (
                <div className="flex justify-center items-center py-12">
                  <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {/* End Message */}
              {!hasMore && articles.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-text-muted">모든 트렌드를 확인했습니다</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
