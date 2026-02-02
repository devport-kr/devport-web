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
  const [selectedGroup, setSelectedGroup] = useState<BenchmarkCategoryGroup>('Composite');
  const [leaderboardEntries, setLeaderboardEntries] = useState<LLMLeaderboardEntryResponse[]>([]);
  const [allBenchmarks, setAllBenchmarks] = useState<LLMBenchmarkResponse[]>([]);
  const [currentBenchmarkInfo, setCurrentBenchmarkInfo] = useState<LLMBenchmarkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBenchmark, setHoveredBenchmark] = useState<BenchmarkType | null>(null);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const benchmarks = await getAllLLMBenchmarks();
        setAllBenchmarks(benchmarks);
      } catch (error) {
        console.error('Failed to fetch benchmarks:', error);
        setIsLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const entries = await getLLMLeaderboard(selectedBenchmark);
        setLeaderboardEntries(entries.slice(0, 50));

        const benchmarkInfo = allBenchmarks.find(b => b.benchmarkType === selectedBenchmark);
        setCurrentBenchmarkInfo(benchmarkInfo || null);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedBenchmark, allBenchmarks]);

  const groupedBenchmarks = allBenchmarks.reduce((acc, benchmark) => {
    const group = benchmark.categoryGroup as BenchmarkCategoryGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(benchmark);
    return acc;
  }, {} as Record<BenchmarkCategoryGroup, LLMBenchmarkResponse[]>);

  const displayBenchmarks = allBenchmarks.filter(benchmark => {
    const group = benchmark.categoryGroup as BenchmarkCategoryGroup;
    return group === selectedGroup;
  });
  const shouldShowBenchmarkTabs = displayBenchmarks.length > 1;

  const hoveredBenchmarkInfo = hoveredBenchmark
    ? allBenchmarks.find(b => b.benchmarkType === hoveredBenchmark)
    : null;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AIIcon className="w-4 h-4 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">LLM 리더보드</h2>
        </div>
        <Link
          to="/benchmarks"
          className="text-xs text-text-muted hover:text-accent transition-colors"
        >
          더보기
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).map((group) => {
            const config = benchmarkCategoryConfig[group];
            return (
              <button
                key={group}
                onClick={() => {
                  setSelectedGroup(group);
                  const firstBenchmark = groupedBenchmarks[group]?.[0];
                  if (firstBenchmark) {
                    setSelectedBenchmark(firstBenchmark.benchmarkType as BenchmarkType);
                  }
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  selectedGroup === group
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {config.labelKo}
              </button>
            );
          })}
        </div>

        {/* Benchmark Sub-tabs */}
        {shouldShowBenchmarkTabs && (
          <div className="flex flex-wrap gap-1 relative">
            {displayBenchmarks.map((benchmark) => {
              const isSelected = selectedBenchmark === benchmark.benchmarkType;
              return (
                <div key={benchmark.benchmarkType} className="relative">
                  <button
                    onClick={() => setSelectedBenchmark(benchmark.benchmarkType as BenchmarkType)}
                    onMouseEnter={() => setHoveredBenchmark(benchmark.benchmarkType as BenchmarkType)}
                    onMouseLeave={() => setHoveredBenchmark(null)}
                    className={`px-2 py-0.5 rounded text-xs transition-all ${
                      isSelected
                        ? 'bg-surface-hover text-text-primary'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {benchmark.displayName}
                  </button>

                  {/* Tooltip */}
                  {hoveredBenchmark === benchmark.benchmarkType && hoveredBenchmarkInfo && (
                    <div className="absolute z-50 bottom-full left-0 mb-2 w-56 p-2 bg-surface-elevated border border-surface-border rounded-lg shadow-soft animate-fade-in">
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {hoveredBenchmarkInfo.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Current Benchmark Description */}
        {currentBenchmarkInfo && (
          <p className="mt-2 text-xs text-text-muted line-clamp-2">
            {currentBenchmarkInfo.description}
          </p>
        )}
      </div>

      {/* Leaderboard Box */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden h-[340px] flex flex-col">
        {/* Leaderboard List */}
        <div className="divide-y divide-surface-border flex-1 overflow-y-auto scrollbar-minimal">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
            </div>
          ) : leaderboardEntries.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <p className="text-sm text-text-muted">데이터가 없습니다</p>
            </div>
          ) : (
            leaderboardEntries.map((entry) => (
              <div
                key={entry.modelId}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
              >
                {/* Rank */}
                <div className="w-6 flex-shrink-0">
                  <span className={`text-xs font-mono ${entry.rank <= 3 ? 'text-accent font-medium' : 'text-text-muted'}`}>
                    {String(entry.rank).padStart(2, '0')}
                  </span>
                </div>

                {/* Model Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {entry.modelName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(() => {
                      const providerInfo = getProviderInfo(entry.provider);
                      return (
                        <>
                          {providerInfo.logo && (
                            <img
                              src={providerInfo.logo}
                              alt={providerInfo.name}
                              className="w-3 h-3 rounded object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-xs text-text-muted">
                            {entry.modelCreatorName || entry.provider}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-medium text-text-primary">
                    {entry.score.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-surface-elevated/30 border-t border-surface-border">
          <p className="text-xs text-text-muted text-center">
            Data by{' '}
            <a
              href="https://artificialanalysis.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Artificial Analysis
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
