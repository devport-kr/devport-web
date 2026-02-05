import { useRef, useEffect } from 'react';
import type { GitRepo } from '../types';
import GitHubIcon from './icons/GitHubIcon';
import StarIcon from './icons/StarIcon';

interface GitHubLeaderboardProps {
  repos: GitRepo[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

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

export default function GitHubLeaderboard({ repos, onLoadMore, hasMore, isLoading }: GitHubLeaderboardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, root: scrollContainerRef.current }
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
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <section>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitHubIcon className="w-4 h-4 text-text-secondary" />
            <h2 className="text-base font-semibold text-text-primary">트렌딩 리포지토리</h2>
          </div>
          <span className="text-xs text-text-muted">GitHub</span>
        </div>
        <p className="text-xs text-text-muted">
          GitHub에서 가장 빠르게 성장 중인 오픈소스 프로젝트입니다
        </p>
      </div>

      {/* List */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden h-[340px] flex flex-col">

        <div
          ref={scrollContainerRef}
          className="divide-y divide-surface-border flex-1 overflow-y-auto scrollbar-minimal"
        >
          {repos.map((repo, index) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors group"
            >
              {/* Rank */}
              <div className="w-6 flex-shrink-0">
                <span className={`text-xs font-mono ${index < 3 ? 'text-accent font-medium' : 'text-text-muted'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                  {repo.summaryKoTitle}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {repo.language && (
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: languageColors[repo.language] || languageColors.default }}
                      />
                      <span className="text-xs text-text-muted">
                        {repo.language}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3 text-text-muted" />
                    <span className="text-xs text-text-muted">
                      {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}

          {/* Observer target */}
          <div ref={observerTarget} className="h-2" />

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <div className="w-5 h-5 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
