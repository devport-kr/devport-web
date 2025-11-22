import type { Article } from '../types';

interface GitHubLeaderboardProps {
  repos: Article[];
}

export default function GitHubLeaderboard({ repos }: GitHubLeaderboardProps) {
  // Get all GitHub repos
  const topRepos = repos.filter(article => article.source === 'github');

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border-l-4 border-purple-600">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl font-extrabold text-navy">GitHub 트렌딩 저장소</h2>
            </div>
            <span className="text-sm text-gray-500">총 {topRepos.length}개 저장소</span>
          </div>
        </div>

        {/* Leaderboard List - Scrollable, shows 5 rows */}
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {topRepos.map((repo, index) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 flex items-center justify-center font-bold text-lg text-gray-700">
                {index + 1}
              </div>

              {/* Repo Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-base transition-colors truncate">
                  {repo.summaryKoTitle}
                </h3>
                <p className="text-sm text-gray-600 truncate mt-0.5">
                  {repo.titleEn}
                </p>
              </div>

              {/* Language Badge (Spoken Language) */}
              {repo.metadata?.language && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    🌐 {repo.metadata.language}
                  </span>
                </div>
              )}

              {/* Tags */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                {repo.tags.slice(0, 1).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0 text-sm text-gray-600">
                {repo.metadata?.stars && (
                  <span className="flex items-center gap-1">
                    <span>⭐</span>
                    <span className="font-semibold">{repo.metadata.stars.toLocaleString()}</span>
                  </span>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-gray-400 group-hover:text-primary-base transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            GitHub에서 가장 인기있는 저장소를 실시간으로 추적합니다
          </p>
        </div>
      </div>
    </section>
  );
}
