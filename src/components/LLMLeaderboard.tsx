import { useState } from 'react';
import type { BenchmarkType } from '../types';
import { benchmarkConfig, icons } from '../types';
import { llmBenchmarkData } from '../llmMockData';

export default function LLMLeaderboard() {
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkType>('AGENTIC_CODING');

  const models = llmBenchmarkData[selectedBenchmark];
  const currentBenchmark = benchmarkConfig[selectedBenchmark];

  const benchmarks: BenchmarkType[] = ['AGENTIC_CODING', 'REASONING', 'MATH', 'VISUAL', 'MULTILINGUAL'];

  return (
    <section className="mb-8">
      <div className="bg-[#1a1d29] rounded-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1f2233] to-[#1a1d29] border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{icons.llmLeaderboard}</span>
            <h2 className="text-2xl font-extrabold text-white">LLM 리더보드</h2>
          </div>

          {/* Benchmark Tabs */}
          <div className="flex flex-wrap gap-2">
            {benchmarks.map((benchmark) => {
              const config = benchmarkConfig[benchmark];
              return (
                <button
                  key={benchmark}
                  onClick={() => setSelectedBenchmark(benchmark)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedBenchmark === benchmark
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-1">{config.icon}</span>
                  {config.labelKo}
                </button>
              );
            })}
          </div>

          {/* Current Benchmark Description */}
          <div className="mt-3 text-sm text-gray-400">
            <p className="font-medium">{currentBenchmark.descriptionKo}</p>
          </div>
        </div>

        {/* Leaderboard List - Scrollable, shows 5 rows */}
        <div className="divide-y divide-gray-700 max-h-[400px] overflow-y-auto dark-scrollbar">
          {models.map((model, index) => (
            <div
              key={model.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-[#20233a] transition-colors group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 flex items-center justify-center font-bold text-lg text-gray-400">
                {index + 1}
              </div>

              {/* Model Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {model.name}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {model.provider}
                </p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-xl font-bold text-indigo-400">
                  {model.score}%
                </div>
              </div>

              {/* Progress Bar Visual */}
              <div className="hidden xl:block flex-shrink-0 w-20">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${model.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#1a1d29] border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            최신 벤치마크 기준으로 LLM 모델의 성능을 비교합니다
          </p>
        </div>
      </div>
    </section>
  );
}
