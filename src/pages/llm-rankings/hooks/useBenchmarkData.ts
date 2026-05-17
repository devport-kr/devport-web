import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BenchmarkType, BenchmarkCategoryGroup } from '../../../types';
import { benchmarkCategoryConfig } from '../../../types';
import {
  getAllLLMBenchmarks,
  getLLMLeaderboard,
  type LLMBenchmarkResponse,
} from '../../../services/llm/llmService';
import type { BenchmarkLeaderboardState } from '../types';
import { makeBenchmarkGroupId } from '../utils';

export function useBenchmarkData() {
  const [benchmarks, setBenchmarks] = useState<LLMBenchmarkResponse[]>([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState(true);
  const [benchmarkLeaderboards, setBenchmarkLeaderboards] = useState<Record<BenchmarkType, BenchmarkLeaderboardState>>(
    {} as Record<BenchmarkType, BenchmarkLeaderboardState>
  );
  const fetchedLeaderboardsRef = useRef<Record<string, boolean>>({});

  // Fetch benchmark metadata
  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        setBenchmarkLoading(true);
        setBenchmarks([]);
        setBenchmarkLeaderboards({} as Record<BenchmarkType, BenchmarkLeaderboardState>);
        fetchedLeaderboardsRef.current = {};

        const benchmarkData = await getAllLLMBenchmarks();
        setBenchmarks(benchmarkData);
      } catch (error) {
        console.error('Failed to fetch benchmarks:', error);
      } finally {
        setBenchmarkLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);

  // Fetch per-benchmark leaderboards
  useEffect(() => {
    if (benchmarks.length === 0) return;

    benchmarks.forEach((benchmark) => {
      const benchmarkType = benchmark.benchmarkType as BenchmarkType;
      if (fetchedLeaderboardsRef.current[benchmarkType]) return;
      fetchedLeaderboardsRef.current[benchmarkType] = true;

      setBenchmarkLeaderboards((prev) => ({
        ...prev,
        [benchmarkType]: {
          entries: prev[benchmarkType]?.entries ?? [],
          loading: true,
          error: null,
        },
      }));

      getLLMLeaderboard(benchmarkType)
        .then((entries) => {
          setBenchmarkLeaderboards((prev) => ({
            ...prev,
            [benchmarkType]: {
              entries,
              loading: false,
              error: null,
            },
          }));
        })
        .catch((error) => {
          console.error('Failed to fetch LLM leaderboard:', error);
          setBenchmarkLeaderboards((prev) => ({
            ...prev,
            [benchmarkType]: {
              entries: [],
              loading: false,
              error: '랭킹 데이터를 불러오지 못했습니다.',
            },
          }));
        });
    });
  }, [benchmarks]);

  // Group benchmarks by category
  const groupedBenchmarks = useMemo(() => {
    const sorted = [...benchmarks].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    return sorted.reduce((acc, benchmark) => {
      const group = benchmark.categoryGroup as BenchmarkCategoryGroup;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(benchmark);
      return acc;
    }, {} as Record<BenchmarkCategoryGroup, LLMBenchmarkResponse[]>);
  }, [benchmarks]);

  // Aggregate stats
  const llmAggregate = useMemo(() => {
    const states = Object.values(benchmarkLeaderboards);
    const modelIds = new Set<string>();
    const providers = new Set<string>();

    states.forEach((state) => {
      state.entries.forEach((entry) => {
        modelIds.add(entry.modelId);
        if (entry.provider) providers.add(entry.provider);
      });
    });

    return {
      benchmarkCount: benchmarks.length,
      modelCount: modelIds.size,
      providerCount: providers.size,
    };
  }, [benchmarkLeaderboards, benchmarks.length]);

  // TOC sections for benchmarks
  const benchmarkTocSections = useMemo(() => {
    const sections: { id: string; label: string }[] = [];
    (Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).forEach((group) => {
      const groupBenchmarks = groupedBenchmarks[group];
      if (!groupBenchmarks || groupBenchmarks.length === 0) return;
      sections.push({ id: makeBenchmarkGroupId(group), label: benchmarkCategoryConfig[group].labelKo });
    });
    return sections;
  }, [groupedBenchmarks]);

  const resetBenchmarkState = useCallback(() => {
    setBenchmarkLeaderboards({} as Record<BenchmarkType, BenchmarkLeaderboardState>);
    fetchedLeaderboardsRef.current = {};
  }, []);

  return {
    benchmarks,
    benchmarkLoading,
    benchmarkLeaderboards,
    groupedBenchmarks,
    llmAggregate,
    benchmarkTocSections,
    resetBenchmarkState,
  };
}
