import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LLMBenchmarkResponse } from '../../../services/llm/llmService';
import type { BenchmarkLeaderboardState, ProviderTickProps } from '../types';
import { toNumber, formatScore } from '../utils';
import { getProviderInfo } from '../../../config/providerLogos';

type BenchmarkCardProps = {
  benchmark: LLMBenchmarkResponse;
  groupLabel: string;
  state?: BenchmarkLeaderboardState;
};

export default function BenchmarkCard({ benchmark, groupLabel, state }: BenchmarkCardProps) {
  const entries = state?.entries ?? [];
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;
  const benchmarkExplanation = benchmark.explanation?.trim() || '설명이 준비 중입니다.';

  const scores = entries
    .map((entry) => toNumber(entry.score))
    .filter((value): value is number => value !== null);
  const topScore = scores.length ? Math.max(...scores) : null;
  const avgScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;

  const chartData = entries
    .map((entry) => {
      const providerInfo = getProviderInfo(entry.provider);
      return {
        rank: entry.rank,
        score: toNumber(entry.score),
        modelName: entry.modelName,
        providerLogo: providerInfo.logo,
        providerName: providerInfo.name,
        providerColor: providerInfo.color ?? '#58a6ff',
      };
    })
    .filter(
      (entry): entry is {
        rank: number;
        score: number;
        modelName: string;
        providerLogo: string;
        providerName: string;
        providerColor: string;
      } => entry.score !== null
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10);

  const providerMap = new Map<number, { logo: string; label: string }>();
  chartData.forEach((item) => {
    providerMap.set(item.rank, {
      logo: item.providerLogo,
      label: item.providerName,
    });
  });

  const renderProviderTick = ({ x, y, payload, dataMap }: ProviderTickProps) => {
    if (x === undefined || y === undefined || !payload?.value) return <g />;
    const rankValue = Number(payload.value);
    if (!Number.isFinite(rankValue)) return <g />;
    const provider = dataMap.get(rankValue);
    if (!provider) return <g />;

    const size = 18;
    const label = provider.label || '';
    const initials = label
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <g transform={`translate(${x},${y + 14})`}>
        {provider.logo ? (
          <image
            href={provider.logo}
            x={-size / 2}
            y={-size / 2}
            width={size}
            height={size}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <>
            <circle cx={0} cy={0} r={size / 2} fill="#262c36" stroke="#30363d" />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize={9}
              fill="#8b949e"
              fontFamily="JetBrains Mono, monospace"
            >
              {initials || '?'}
            </text>
          </>
        )}
      </g>
    );
  };

  const visibleEntries = entries.slice(0, 10);
  const gradientId = `benchmark-${benchmark.benchmarkType}-gradient`;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-soft">
      <div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">{groupLabel}</p>
          <h3 className="text-base font-semibold text-text-primary mt-1">{benchmark.displayName}</h3>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{benchmarkExplanation}</p>
        </div>
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-4">
        <div className="rounded-lg border border-surface-border bg-surface-elevated/60 p-2">
          <p className="text-[10px] text-text-muted">최고 스코어</p>
          <p className="text-sm font-semibold text-text-primary mt-1">
            {loading ? '-' : `${formatScore(topScore)}%`}
          </p>
        </div>
        <div className="rounded-lg border border-surface-border bg-surface-elevated/60 p-2">
          <p className="text-[10px] text-text-muted">평균 스코어</p>
          <p className="text-sm font-semibold text-text-primary mt-1">
            {loading ? '-' : `${formatScore(avgScore)}%`}
          </p>
        </div>
      </div>

      <div className="mt-4 h-[180px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-xs text-text-muted">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-text-muted">데이터가 없습니다</div>
        ) : (
          <div className="h-full w-full overflow-x-auto scrollbar-minimal">
            <div className="h-full min-w-[340px]">
              <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#58a6ff" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="rank"
                tick={(props: any) => renderProviderTick({ ...props, dataMap: providerMap })}
                interval={0}
                axisLine={false}
                tickLine={false}
                height={30}
              />
              <YAxis
                tick={{ fill: '#8b949e', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 12,
                  color: '#f0f6fc',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f0f6fc' }}
                itemStyle={{ color: '#f0f6fc' }}
                formatter={(value: number | string, _name: string, props: any) => {
                  const label = props?.payload?.modelName ?? '';
                  const numericValue = typeof value === 'number' ? value : Number(value);
                  const formattedValue = Number.isFinite(numericValue)
                    ? numericValue.toFixed(1)
                    : String(value);
                  return [`${formattedValue}%`, label];
                }}
                labelFormatter={() => 'Score'}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={20}>
                {chartData.map((entry) => (
                  <Cell key={entry.rank} fill={entry.providerColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-32 flex items-center justify-center text-xs text-text-muted">랭킹 불러오는 중...</div>
        ) : error ? (
          <div className="h-20 flex items-center justify-center text-xs text-text-muted">랭킹을 불러오지 못했습니다.</div>
        ) : entries.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-xs text-text-muted">데이터가 없습니다</div>
        ) : (
          <div className="divide-y divide-surface-border">
            {visibleEntries.map((entry) => (
              <div key={entry.modelId} className="flex items-center gap-3 py-2">
                <span className="w-7 text-xs font-mono text-text-muted">
                  {String(entry.rank).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{entry.modelName}</p>
                  <p className="text-xs text-text-muted truncate">
                    {entry.modelCreatorName || entry.provider}
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-secondary">
                  {formatScore(entry.score)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
