import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import type { BenchmarkCategoryGroup } from '../types';
import { benchmarkCategoryConfig } from '../types';
import { getAllLLMBenchmarks, type LLMBenchmarkResponse } from '../services/api';

export default function BenchmarksExplanationPage() {
  const [benchmarks, setBenchmarks] = useState<LLMBenchmarkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        setIsLoading(true);
        const data = await getAllLLMBenchmarks();
        setBenchmarks(data);
      } catch (error) {
        console.error('Failed to fetch benchmarks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);

  // Group benchmarks by category
  const groupedBenchmarks = benchmarks.reduce((acc, benchmark) => {
    const group = benchmark.categoryGroup as BenchmarkCategoryGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(benchmark);
    return acc;
  }, {} as Record<BenchmarkCategoryGroup, LLMBenchmarkResponse[]>);

  // Sort groups by predefined order
  const groupOrder: BenchmarkCategoryGroup[] = ['Composite', 'Agentic', 'Reasoning', 'Coding', 'Math', 'Specialized'];
  const sortedGroups = groupOrder.filter(group => groupedBenchmarks[group]?.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1117] via-[#141824] to-[#0f1117]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>

          <h1 className="text-4xl font-extrabold text-white mb-3">LLM 벤치마크 설명</h1>
          <p className="text-lg text-gray-400">
            각 벤치마크가 무엇을 측정하는지, 왜 중요한지 자세히 알아보세요.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center gap-3 text-indigo-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
              <span className="text-xl font-medium">로딩 중...</span>
            </div>
          </div>
        ) : (
          /* Benchmark Groups */
          <div className="space-y-10">
            {sortedGroups.map((group) => {
              const config = benchmarkCategoryConfig[group];
              const groupBenchmarks = groupedBenchmarks[group] || [];

              return (
                <div key={group} className="bg-[#1a1d29] rounded-2xl border border-gray-700 overflow-hidden">
                  {/* Group Header */}
                  <div className={`px-6 py-4 bg-gradient-to-r from-[#1f2233] to-[#1a1d29] border-b border-gray-700`}>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${config.color}`}>
                        {config.labelKo}
                      </span>
                      <span>{config.label}</span>
                    </h2>
                  </div>

                  {/* Benchmarks in Group */}
                  <div className="divide-y divide-gray-700">
                    {groupBenchmarks.map((benchmark) => (
                      <div key={benchmark.benchmarkType} className="px-6 py-5 hover:bg-[#20233a] transition-colors">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {benchmark.displayName}
                        </h3>

                        {/* Short Description */}
                        <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                          {benchmark.description}
                        </p>

                        {/* Detailed Explanation (if available) */}
                        {benchmark.explanation && (
                          <div className="mt-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <h4 className="text-sm font-semibold text-indigo-400 mb-2">상세 설명</h4>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                              {benchmark.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attribution Footer */}
        <div className="mt-12 p-6 bg-[#1a1d29] rounded-xl border border-gray-700 text-center">
          <p className="text-sm text-gray-400">
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
      </main>
    </div>
  );
}
