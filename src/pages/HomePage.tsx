import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TrendingTicker from '../components/TrendingTicker';
import GitHubLeaderboard from '../components/GitHubLeaderboard';
import LLMLeaderboard from '../components/LLMLeaderboard';
import ArticleCard from '../components/ArticleCard';
import { getArticles, getTrendingGitReposPaginated, getTrendingTicker } from '../services/articles/articlesService';
import type { Article, GitRepo, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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

  const [loadCount, setLoadCount] = useState(0);
  const MAX_ANONYMOUS_LOADS = 3;

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [tickerHidden, setTickerHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!tickerRef.current) return;
      const rect = tickerRef.current.getBoundingClientRect();
      setTickerHidden(rect.bottom <= 64); // 64px = navbar height (4rem)
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setReposLoading(true);
      try {
        if (!isAuthenticated && selectedCategory !== 'ALL') {
          setArticles([]);
          setHasMore(true);
          setCurrentPage(0);
          setLoadCount(MAX_ANONYMOUS_LOADS);
          setIsInitialLoading(false);
          setIsLoading(false);
          setReposLoading(false);

          const [githubData, tickerData] = await Promise.all([
            getTrendingGitReposPaginated(0, 10),
            getTrendingTicker(),
          ]);
          setGithubRepos(githubData.content);
          setReposHasMore(githubData.hasMore);
          setReposPage(0);
          setTickerArticles(tickerData);
          return;
        }

        const [articlesData, githubData, tickerData] = await Promise.all([
          getArticles(selectedCategory === 'ALL' ? undefined : selectedCategory, 0, 9),
          getTrendingGitReposPaginated(0, 10),
          getTrendingTicker(),
        ]);

        setArticles(articlesData.content);
        setHasMore(articlesData.hasMore);
        setCurrentPage(0);
        setLoadCount(0);
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
  }, [selectedCategory, isAuthenticated]);

  const fetchMoreArticles = useCallback(async () => {
    if (isLoading || !hasMore) return;
    if (!isAuthenticated && loadCount >= MAX_ANONYMOUS_LOADS) return;

    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const pageSize = !isAuthenticated && loadCount > 0 ? 3 : 9;

      const data = await getArticles(
        selectedCategory === 'ALL' ? undefined : selectedCategory,
        nextPage,
        pageSize
      );

      setArticles((prev) => [...prev, ...data.content]);
      setHasMore(data.hasMore);
      setCurrentPage(nextPage);
      setLoadCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to fetch more articles:', error);
    } finally {
      setIsLoading(false);
      setShowLoadingSpinner(false);
    }
  }, [isLoading, hasMore, isAuthenticated, loadCount, currentPage, selectedCategory]);

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
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* Trending Ticker - with left margin to avoid left sidebar */}
        <div ref={tickerRef} className="lg:ml-52 border-b border-surface-border/50">
          <TrendingTicker articles={tickerArticles} />
        </div>

        {/* Right Sidebar - Fixed, slides up when ticker scrolls away */}
        <aside
          className="fixed right-0 w-[28%] min-w-[380px] max-w-[500px] pt-8 pb-8 px-6 border-l border-surface-border/50 overflow-y-auto hidden xl:block bg-surface z-40 scrollbar-hide transition-all duration-300 ease-out"
          style={{
            top: tickerHidden ? '4rem' : '8.5rem',
            height: tickerHidden ? 'calc(100vh - 4rem)' : 'calc(100vh - 8.5rem)',
          }}
        >
          <div className="space-y-6">
            <LLMLeaderboard />
            <GitHubLeaderboard
              repos={githubRepos}
              onLoadMore={fetchMoreGitRepos}
              hasMore={reposHasMore}
              isLoading={reposLoading}
            />
          </div>
        </aside>

        {/* Center - Articles (truly centered on viewport) */}
        <main className="pt-8 pb-8 px-8">
          <div className="max-w-xl mx-auto">
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

              {/* Login Prompt for Anonymous Users */}
              {!isAuthenticated && loadCount >= MAX_ANONYMOUS_LOADS && hasMore && (
                <div className="relative py-12 mt-8">
                  {/* Blurred Preview */}
                  <div className="space-y-4 mb-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-surface-card rounded-2xl p-6 border border-surface-border opacity-30 blur-sm h-32"
                      >
                        <div className="h-3 bg-surface-hover rounded w-1/4 mb-4" />
                        <div className="h-4 bg-surface-hover rounded w-3/4 mb-2" />
                        <div className="h-4 bg-surface-hover rounded w-1/2" />
                      </div>
                    ))}
                  </div>

                  {/* Login CTA */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-surface-card/95 backdrop-blur-xl rounded-2xl p-10 border border-surface-border shadow-soft max-w-md w-full text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>

                      <h3 className="text-xl font-medium text-text-primary mb-2">
                        더 많은 트렌드 확인하기
                      </h3>

                      <p className="text-sm text-text-muted mb-6">
                        로그인하고 무료로 개발 트렌드를 무제한으로 확인하세요
                      </p>

                      <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors"
                      >
                        로그인
                      </button>

                      <p className="text-xs text-text-muted mt-4">
                        {articles.length}개의 글을 확인했습니다
                      </p>
                    </div>
                  </div>
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

      {/* Footer */}
      <footer className="pt-16 pb-10 px-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-0.5 mb-2">
            <span className="text-sm font-semibold text-text-muted">devport</span>
            <span className="text-accent text-sm font-semibold">.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs mb-4">
            <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">About</a>
            <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">Privacy</a>
            <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">Terms</a>
            <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">Contact</a>
          </div>
          <p className="text-2xs text-text-muted/50">© 2025 devport.kr</p>
        </div>
      </footer>
    </div>
  );
}
