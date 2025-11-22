import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import TrendingTicker from './components/TrendingTicker';
import GitHubLeaderboard from './components/GitHubLeaderboard';
import LLMLeaderboard from './components/LLMLeaderboard';
import ArticleCard from './components/ArticleCard';
import { mockArticles } from './mockData';
import type { Category } from './types';
import { icons } from './types';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [displayCount, setDisplayCount] = useState(9); // Show 9 articles initially
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter out GitHub repos for the main grid (they'll be shown in leaderboard)
  const nonGitHubArticles = mockArticles.filter(article => article.source !== 'github');

  // Filter by category
  const allFilteredArticles = selectedCategory === 'ALL'
    ? nonGitHubArticles
    : nonGitHubArticles.filter(article => article.category === selectedCategory);

  // Display limited articles for infinite scroll
  const filteredArticles = allFilteredArticles.slice(0, displayCount);
  const hasMore = displayCount < allFilteredArticles.length;

  // Reset display count when category changes
  useEffect(() => {
    setDisplayCount(9);
  }, [selectedCategory]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          // Simulate loading delay
          setTimeout(() => {
            setDisplayCount((prev) => prev + 9);
            setIsLoading(false);
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
    };
  }, [hasMore, isLoading]);

  const categories = [
    { id: 'ALL' as const, label: '전체', icon: '📚' },
    { id: 'AI_LLM' as const, label: 'AI/LLM', icon: '🤖' },
    { id: 'DEVOPS_SRE' as const, label: 'DevOps/SRE', icon: '⚙️' },
    { id: 'BACKEND' as const, label: 'Backend', icon: '🔧' },
    { id: 'INFRA_CLOUD' as const, label: 'Infra/Cloud', icon: '☁️' },
    { id: 'OTHER' as const, label: '기타', icon: '📌' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Trending News Ticker */}
        <TrendingTicker articles={mockArticles} />

        {/* GitHub Trending Leaderboard */}
        <GitHubLeaderboard repos={mockArticles} />

        {/* LLM Leaderboard */}
        <LLMLeaderboard />

        {/* Articles with Category Tabs */}
        <section>
          <div className="bg-[#1a1d29] rounded-2xl p-6 mb-6 border border-gray-700">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-4">
              <span className="text-3xl">{icons.trendingBlog}</span>
              트렌딩 블로그
            </h2>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="h-10"></div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-3 text-blue-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="text-lg font-medium">더 많은 트렌드 로딩 중...</span>
              </div>
            </div>
          )}

          {/* End Message */}
          {!hasMore && filteredArticles.length > 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">모든 트렌드를 확인했습니다 ({allFilteredArticles.length}개)</p>
            </div>
          )}

          {/* Empty State */}
          {filteredArticles.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">해당 카테고리의 트렌드가 없습니다.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold">devport.kr</p>
              <p className="text-sm text-gray-300 mt-1">개발자를 위한 글로벌 트렌드 포털</p>
            </div>

            <div className="flex gap-6 text-sm">
              <a href="#" className="text-primary-light hover:text-white transition-colors">
                About DevPort
              </a>
              <a href="#" className="text-primary-light hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-primary-light hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="text-primary-light hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
            © 2025 devport.kr - All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
