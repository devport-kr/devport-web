import type { Article } from '../types';
import { icons } from '../types';

interface GitHubLeaderboardProps {
  repos: Article[];
}

export default function GitHubLeaderboard({ repos }: GitHubLeaderboardProps) {
  // Get all GitHub repos
  const topRepos = repos.filter(article => article.source === 'github');

  return (
    <section className="mb-8">
      <div className="bg-[#1a1d29] rounded-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1f2233] to-[#1a1d29] border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icons.githubLeaderboard}</span>
            <h2 className="text-2xl font-extrabold text-white">트렌딩 리포지토리</h2>
          </div>
        </div>

        {/* Leaderboard List - Scrollable, shows 5 rows */}
        <div className="divide-y divide-gray-700 max-h-[400px] overflow-y-auto dark-scrollbar">
          {topRepos.map((repo, index) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-6 py-4 hover:bg-[#20233a] transition-colors group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 flex items-center justify-center font-bold text-lg text-gray-400">
                {index + 1}
              </div>

              {/* Repo Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                  {repo.summaryKoTitle}
                </h3>
                <p className="text-sm text-gray-400 truncate mt-0.5">
                  {repo.titleEn}
                </p>
              </div>

              {/* Language Badge (Spoken Language) */}
              {repo.metadata?.language && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded border border-emerald-500/30">
                    {icons.language} {repo.metadata.language}
                  </span>
                </div>
              )}

              {/* Tags */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                {repo.tags.slice(0, 1).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded border border-purple-500/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0 text-sm text-gray-400">
                {repo.metadata?.stars && (
                  <span className="flex items-center gap-1">
                    <span>{icons.star}</span>
                    <span className="font-semibold text-yellow-400">{repo.metadata.stars.toLocaleString()}</span>
                  </span>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-gray-500 group-hover:text-purple-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#1a1d29] border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            GitHub에서 가장 인기있는 저장소를 실시간으로 추적합니다
          </p>
        </div>
      </div>
    </section>
  );
}
