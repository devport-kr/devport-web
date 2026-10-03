import { useRef, useEffect } from 'react';
import type { GitRepo } from '../types';
import GitHubIcon from './icons/GitHubIcon';
import StarIcon from './icons/StarIcon';
import RailHeader from './RailHeader';

const formatCount = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString();

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
      <RailHeader
        icon={<GitHubIcon className="w-4 h-4 text-text-secondary" />}
        title="트렌딩 리포지토리"
        description="GitHub에서 가장 빠르게 성장 중인 오픈소스 프로젝트입니다"
      />

      {/* List */}
      <div className="panel overflow-hidden h-[340px] flex flex-col">
        <div className="table-head grid-cols-[1.5rem_minmax(0,1fr)_auto]">
          <span>#</span>
          <span>리포지토리</span>
          <span className="text-right">스타</span>
        </div>

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
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors group"
            >
              {/* Rank */}
              <span className={`text-xs font-mono tabular-nums ${index < 3 ? 'text-signal font-semibold' : 'text-text-muted'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Content */}
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                  {repo.summaryKoTitle}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <span className="font-mono text-[11px] text-text-muted truncate">{repo.fullName}</span>
                  {repo.language && (
                    <span className="flex items-center gap-1 shrink-0">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: languageColors[repo.language] || languageColors.default }}
                      />
                      <span className="font-mono text-[11px] text-text-muted">{repo.language}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Stars */}
              <div className="text-right font-mono tabular-nums">
                <span className="flex items-center justify-end gap-1 text-xs text-text-secondary">
                  <StarIcon className="w-3 h-3 text-text-muted" />
                  {formatCount(repo.stars)}
                </span>
                {repo.starsThisWeek > 0 && (
                  <span className="block text-[11px] text-signal" title="이번 주 증가">
                    +{formatCount(repo.starsThisWeek)}
                  </span>
                )}
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
