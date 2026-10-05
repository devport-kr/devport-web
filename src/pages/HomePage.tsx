import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrendingTicker from '../components/TrendingTicker';
import GitHubLeaderboard from '../components/GitHubLeaderboard';
import LLMLeaderboard from '../components/LLMLeaderboard';
import ArticleCard from '../components/ArticleCard';
import { getArticles, getTrendingGitReposPaginated, getTrendingTicker } from '../services/articles/articlesService';
import type { Article, GitRepo, Category } from '../types';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [articles, setArticles] = useState<Article[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitRepo[]>([]);
  const [tickerArticles, setTickerArticles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [reposPage, setReposPage] = useState(0);
  const [reposHasMore, setReposHasMore] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setReposLoading(true);
      try {
        const [articlesData, githubData, tickerData] = await Promise.all([
          getArticles(selectedCategory === 'ALL' ? undefined : selectedCategory, 0, 9),
          getTrendingGitReposPaginated(0, 10),
          getTrendingTicker(),
        ]);

        setArticles(articlesData.content);
        setHasMore(articlesData.hasMore);
        setCurrentPage(0);
        setGithubRepos(githubData.content);
        setReposHasMore(githubData.hasMore);
        setReposPage(0);
        setTickerArticles(tickerData);
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
        setReposLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedCategory]);

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

  const fetchMoreGitRepos = async () => {
    if (reposLoading || !reposHasMore) return;

    try {
      setReposLoading(true);
      const nextPage = reposPage + 1;
      const data = await getTrendingGitReposPaginated(nextPage, 10);

      setGithubRepos((prev) => [...prev, ...data.content]);
      setReposHasMore(data.hasMore);
      setReposPage(nextPage);
    } catch (error) {
      console.error('Failed to fetch more GitHub repos:', error);
    } finally {
      setReposLoading(false);
    }
  };

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

        <div className="relative">
          {/* Left rail - flush to the left edge; the inner panel sticks under the navbar */}
          <aside className="hidden xl:block absolute inset-y-0 left-0 w-[360px] border-r border-surface-border/50 bg-surface">
            <div className="sticky top-16 h-[calc(100vh-4rem)] px-6 py-8 overflow-y-auto scrollbar-hide space-y-6">
              <LLMLeaderboard />
              <GitHubLeaderboard
                repos={githubRepos}
                onLoadMore={fetchMoreGitRepos}
                hasMore={reposHasMore}
                isLoading={reposLoading}
              />
            </div>
          </aside>

          {/* Articles - centered in the column to the right of the 360px rail */}
          <main className="px-4 md:px-8 xl:pl-[calc(360px+2rem)] pt-8 pb-24 lg:pb-8">
            <div className="max-w-2xl mx-auto">
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
      </div>

      <Footer />
    </div>
  );
}
