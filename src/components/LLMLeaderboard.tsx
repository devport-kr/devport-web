import { useState, useEffect } from 'react';
import type { BenchmarkType, BenchmarkCategoryGroup } from '../types';
import { benchmarkCategoryConfig } from '../types';
import {
  getLLMLeaderboard,
  getAllLLMBenchmarks,
  type LLMLeaderboardEntryResponse,
  type LLMBenchmarkResponse,
} from '../services/llm/llmService';
import AIIcon from './icons/AIIcon';
import { getProviderInfo } from '../config/providerLogos';
import RailHeader from './RailHeader';

const formatScore = (score?: number | string | null, digits: number = 1) => {
  if (score === null || score === undefined) return '-';
  const numericScore = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(numericScore)) return '-';
  return numericScore.toFixed(digits);
};

export default function LLMLeaderboard() {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkType>('AA_INTELLIGENCE_INDEX');
  const [selectedGroup, setSelectedGroup] = useState<BenchmarkCategoryGroup>('Composite');
  const [leaderboardEntries, setLeaderboardEntries] = useState<LLMLeaderboardEntryResponse[]>([]);
  const [allBenchmarks, setAllBenchmarks] = useState<LLMBenchmarkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <section>
      <RailHeader
        kicker={<><AIIcon className="w-3.5 h-3.5" /> Benchmarks</>}
        title="LLM 리더보드"
        moreTo="/llm-rankings"
      />

      {/* Category Tabs */}
      <div className="mb-3 space-y-2">
        <div className="tabbar" role="group" aria-label="벤치마크 분류">
          {(Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).map((group) => {
            const config = benchmarkCategoryConfig[group];
            return (
              <button
                key={group}
                type="button"
                aria-pressed={selectedGroup === group}
                onClick={() => {
                  setSelectedGroup(group);
                  const firstBenchmark = groupedBenchmarks[group]?.[0];
                  if (firstBenchmark) {
                    setSelectedBenchmark(firstBenchmark.benchmarkType as BenchmarkType);
                  }
                }}
                className="tabbar-item"
              >
                {config.labelKo}
              </button>
            );
          })}
        </div>

        {/* Benchmark Sub-tabs */}
        {shouldShowBenchmarkTabs && (
          <div className="flex flex-wrap gap-x-3 gap-y-1" role="group" aria-label="벤치마크">
            {displayBenchmarks.map((benchmark) => {
              const isSelected = selectedBenchmark === benchmark.benchmarkType;
              return (
                <button
                  key={benchmark.benchmarkType}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedBenchmark(benchmark.benchmarkType as BenchmarkType)}
                  className={`py-0.5 font-mono text-[11px] border-b transition-colors ${
                    isSelected
                      ? 'text-text-primary border-accent'
                      : 'text-text-muted border-transparent hover:text-text-secondary'
                  }`}
                >
                  {benchmark.displayName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard Box */}
      <div className="panel overflow-hidden h-[340px] flex flex-col">
        <div className="table-head grid-cols-[1.5rem_minmax(0,1fr)_auto]">
          <span>#</span>
          <span>Model</span>
          <span className="text-right">Score</span>
        </div>

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
            leaderboardEntries.map((entry) => {
              const providerInfo = getProviderInfo(entry.provider);
              const numericScore = Number(entry.score);
              const barWidth = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0;
              return (
                <div
                  key={entry.modelId}
                  className="relative grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
                >
                  {/* Rank */}
                  <span className={`text-xs font-mono tabular-nums ${entry.rank <= 3 ? 'text-signal font-semibold' : 'text-text-muted'}`}>
                    {String(entry.rank).padStart(2, '0')}
                  </span>

                  {/* Model Info */}
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {entry.modelName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {providerInfo.logo && (
                        <img
                          src={providerInfo.logo}
                          alt=""
                          className="w-3 h-3 rounded-sm object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <p className="font-mono text-[11px] text-text-muted truncate">
                        {entry.modelCreatorName || entry.provider}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <span className="text-sm font-mono font-medium text-text-primary tabular-nums text-right">
                    {formatScore(entry.score, 1)}%
                  </span>

                  {/* Score bar */}
                  <span
                    className="absolute left-0 bottom-0 h-0.5 bg-accent/50"
                    style={{ width: `${barWidth}%` }}
                    aria-hidden="true"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
