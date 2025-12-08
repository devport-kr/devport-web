import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { BenchmarkType, BenchmarkCategoryGroup } from '../types';
import { benchmarkCategoryConfig } from '../types';
import {
  getLLMLeaderboard,
  getAllLLMBenchmarks,
  type LLMLeaderboardEntryResponse,
  type LLMBenchmarkResponse,
} from '../services/api';
import AIIcon from './icons/AIIcon';
import { getProviderInfo } from '../config/providerLogos';

export default function LLMLeaderboard() {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkType>('AA_INTELLIGENCE_INDEX');
  const [selectedGroup, setSelectedGroup] = useState<BenchmarkCategoryGroup>('Composite'); // Default to Composite
  const [leaderboardEntries, setLeaderboardEntries] = useState<LLMLeaderboardEntryResponse[]>([]);
  const [allBenchmarks, setAllBenchmarks] = useState<LLMBenchmarkResponse[]>([]);
  const [currentBenchmarkInfo, setCurrentBenchmarkInfo] = useState<LLMBenchmarkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBenchmark, setHoveredBenchmark] = useState<BenchmarkType | null>(null);

  // Fetch all benchmarks on mount
  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const benchmarks = await getAllLLMBenchmarks();
        console.log('✅ Fetched benchmarks:', benchmarks.length);
        setAllBenchmarks(benchmarks);
      } catch (error) {
        console.error('❌ Failed to fetch benchmarks:', error);
        // Set loading to false even if benchmarks fail
        setIsLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);

  // Fetch leaderboard when selected benchmark changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Fetching leaderboard for:', selectedBenchmark);
        const entries = await getLLMLeaderboard(selectedBenchmark);
        console.log('✅ Fetched entries:', entries.length);
        setLeaderboardEntries(entries.slice(0, 50)); // Show top 50

        // Find current benchmark info
        const benchmarkInfo = allBenchmarks.find(b => b.benchmarkType === selectedBenchmark);
        setCurrentBenchmarkInfo(benchmarkInfo || null);
      } catch (error) {
        console.error('❌ Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Always try to fetch leaderboard, even if benchmarks haven't loaded yet
    fetchLeaderboard();
  }, [selectedBenchmark, allBenchmarks]);

  // Group benchmarks by category
  const groupedBenchmarks = allBenchmarks.reduce((acc, benchmark) => {
    const group = benchmark.categoryGroup as BenchmarkCategoryGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(benchmark);
    return acc;
  }, {} as Record<BenchmarkCategoryGroup, LLMBenchmarkResponse[]>);

  // Single-benchmark categories: Composite, Math, Specialized
  // Don't show sub-tabs for these, just show the score directly
  const shouldShowBenchmarkTabs = !['Composite', 'Math', 'Specialized'].includes(selectedGroup);

  const displayBenchmarks = allBenchmarks.filter(benchmark => {
    const group = benchmark.categoryGroup as BenchmarkCategoryGroup;
    return group === selectedGroup;
  });

  // Get hovered benchmark info for tooltip
  const hoveredBenchmarkInfo = hoveredBenchmark
    ? allBenchmarks.find(b => b.benchmarkType === hoveredBenchmark)
    : null;

  return (
    <section className="mb-8">
      <div className="bg-[#1a1d29] rounded-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1f2233] to-[#1a1d29] border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <AIIcon className="w-7 h-7 text-blue-400" />
            <h2 className="text-2xl font-extrabold text-white">LLM 리더보드</h2>
          </div>

          {/* Category Tabs (all 4 categories) */}
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).map((group) => {
              const config = benchmarkCategoryConfig[group];
              return (
                <button
                  key={group}
                  onClick={() => {
                    setSelectedGroup(group);
                    // Auto-select first benchmark in the group
                    const firstBenchmark = groupedBenchmarks[group]?.[0];
                    if (firstBenchmark) {
                      setSelectedBenchmark(firstBenchmark.benchmarkType as BenchmarkType);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedGroup === group
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {config.labelKo}
                </button>
              );
            })}
          </div>

          {/* Benchmark Tabs (only show for non-Composite categories) */}
          {shouldShowBenchmarkTabs && (
            <div className="flex flex-wrap gap-2 relative mb-3">
              {displayBenchmarks.map((benchmark) => {
              const isSelected = selectedBenchmark === benchmark.benchmarkType;
              return (
                <div key={benchmark.benchmarkType} className="relative">
                  <button
                    onClick={() => setSelectedBenchmark(benchmark.benchmarkType as BenchmarkType)}
                    onMouseEnter={() => setHoveredBenchmark(benchmark.benchmarkType as BenchmarkType)}
                    onMouseLeave={() => setHoveredBenchmark(null)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all text-xs ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {benchmark.displayName}
                  </button>

                  {/* Tooltip */}
                  {hoveredBenchmark === benchmark.benchmarkType && hoveredBenchmarkInfo && (
                    <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {hoveredBenchmarkInfo.description}
                      </p>
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-600"></div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}

          {/* Current Benchmark Description */}
          {currentBenchmarkInfo && (
            <div className="mt-3 text-sm text-gray-400">
              <p className="font-medium">{currentBenchmarkInfo.description}</p>
            </div>
          )}

          {/* Learn More Button */}
          <div className="mt-3">
            <Link
              to="/benchmarks"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              해당 벤치마크에 대해 더 알아보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="divide-y divide-gray-700 max-h-[400px] overflow-y-auto dark-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3 text-indigo-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                <span className="text-lg font-medium">로딩 중...</span>
              </div>
            </div>
          ) : leaderboardEntries.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-400">데이터가 없습니다</p>
            </div>
          ) : (
            leaderboardEntries.map((entry) => (
              <div
                key={entry.modelId}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#20233a] transition-colors group"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex items-center justify-center font-bold text-lg text-gray-400">
                  {entry.rank}
                </div>

                {/* Model Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {entry.modelName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const providerInfo = getProviderInfo(entry.provider);
                      return (
                        <>
                          {providerInfo.logo && (
                            <img
                              src={providerInfo.logo}
                              alt={providerInfo.name}
                              className="w-4 h-4 rounded object-contain"
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-sm text-gray-400">
                            {entry.modelCreatorName || entry.provider}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-xl font-bold text-indigo-400">
                    {entry.score.toFixed(1)}%
                  </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="hidden xl:block flex-shrink-0 w-20">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(entry.score, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Attribution */}
        <div className="px-6 py-3 bg-[#1a1d29] border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            <span className="font-semibold">Attribution:</span> Data provided by{' '}
            <a
              href="https://artificialanalysis.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Artificial Analysis
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
