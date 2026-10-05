import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GitHubIcon from '../components/icons/GitHubIcon';
import StarIcon from '../components/icons/StarIcon';
import ForkIcon from '../components/icons/ForkIcon';
import { getTrendingGitReposPaginated } from '../services/articles/articlesService';
import { stripMarkdown } from '../lib/markdown';
import { categoryConfig } from '../types';
import type { GitRepo } from '../types';

const PAGE_SIZE = 20;

const languageColors: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  default: '#6b7280',
};

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString());

// Korean titles often start with "owner/repo: ", which is already shown above the title
const displayTitle = (repo: GitRepo) => {
  const prefix = `${repo.fullName}:`;
  return repo.summaryKoTitle.startsWith(prefix)
    ? repo.summaryKoTitle.slice(prefix.length).trim()
    : repo.summaryKoTitle;
};

// Summary excerpt without section headings such as "## 개요"
const summaryExcerpt = (repo: GitRepo) =>
  repo.summaryKoBody
    ? stripMarkdown(repo.summaryKoBody.replace(/^#{1,6}\s.*$/gm, ''))
    : repo.description ?? '';

export default function TrendingReposPage() {
  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialRepos = async () => {
      try {
        const data = await getTrendingGitReposPaginated(0, PAGE_SIZE);
        setRepos(data.content);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Failed to fetch trending repos:', error);
        setHasError(true);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialRepos();
  }, []);

  const fetchMoreRepos = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      const nextPage = page + 1;
      const data = await getTrendingGitReposPaginated(nextPage, PAGE_SIZE);
      setRepos((prev) => [...prev, ...data.content]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to fetch more trending repos:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  useEffect(() => {
    if (isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMoreRepos();
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => observer.disconnect();
  }, [fetchMoreRepos, isInitialLoading]);

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="px-4 md:px-8 pt-12 pb-24 lg:pb-12">
        <div className="max-w-3xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-3 text-sm text-text-muted">
              <GitHubIcon className="w-4 h-4" />
              GitHub
            </div>
            <h1 className="text-3xl font-semibold text-text-primary mb-3">트렌딩 리포지토리</h1>
            <p className="text-text-muted">GitHub에서 가장 빠르게 성장 중인 오픈소스 프로젝트를 한국어 요약과 함께 소개합니다.</p>
          </header>

          {isInitialLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
            </div>
          ) : hasError ? (
            <p className="py-24 text-center text-text-secondary">리포지토리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : repos.length === 0 ? (
            <p className="py-24 text-center text-text-secondary">아직 트렌딩 리포지토리가 없습니다.</p>
          ) : (
            <>
              <ol className="border-t border-surface-border">
                {repos.map((repo, index) => {
                  const excerpt = summaryExcerpt(repo);
                  return (
                    <li key={repo.id} className="border-b border-surface-border">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-4 sm:gap-6 py-6 -mx-4 px-4 hover:bg-surface-card/30 transition-colors group"
                      >
                        {/* Rank */}
                        <span className={`w-7 shrink-0 pt-0.5 text-sm font-mono ${index < 3 ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 text-xs">
                            {categoryConfig[repo.category] && (
                              <>
                                <span className="font-medium text-accent">{categoryConfig[repo.category].label}</span>
                                <span className="text-text-muted">·</span>
                              </>
                            )}
                            <span className="font-mono text-text-muted truncate">{repo.fullName}</span>
                          </div>

                          <h2 className="text-lg font-semibold text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors">
                            {displayTitle(repo)}
                          </h2>

                          {excerpt && (
                            <p className="text-sm text-text-secondary mb-4 line-clamp-2">{excerpt}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                            {repo.language && (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: languageColors[repo.language] || languageColors.default }}
                                />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <StarIcon className="w-3.5 h-3.5" />
                              {formatCount(repo.stars)}
                            </span>
                            <span className="flex items-center gap-1">
                              <ForkIcon className="w-3.5 h-3.5" />
                              {formatCount(repo.forks)}
                            </span>
                            {repo.starsThisWeek > 0 && (
                              <span className="text-accent">이번 주 +{formatCount(repo.starsThisWeek)}</span>
                            )}
                          </div>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ol>

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="h-10" />

              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {!hasMore && (
                <p className="py-12 text-center text-sm text-text-muted">모든 리포지토리를 확인했습니다</p>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
