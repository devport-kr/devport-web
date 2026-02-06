import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TrendingTicker from '../components/TrendingTicker';
import AIIcon from '../components/icons/AIIcon';
import type { BenchmarkCategoryGroup, BenchmarkType } from '../types';
import { benchmarkCategoryConfig } from '../types';
import {
  getAllLLMBenchmarks,
  getLLMBenchmarksByGroup,
  getLLMLeaderboard,
  getLLMMediaLeaderboard,
  getTrendingTicker,
  type LLMBenchmarkResponse,
  type LLMLeaderboardEntryResponse,
  type LLMMediaModelResponse,
  type LLMMediaType,
} from '../services/api';
import { getProviderInfo } from '../config/providerLogos';
import { useAuth } from '../contexts/AuthContext';

type MediaLeaderboardState = {
  items: LLMMediaModelResponse[];
  page: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

type BenchmarkLeaderboardState = {
  entries: LLMLeaderboardEntryResponse[];
  loading: boolean;
  error: string | null;
};

const createMediaState = (): MediaLeaderboardState => ({
  items: [],
  page: 0,
  totalElements: 0,
  totalPages: 0,
  last: false,
  loading: false,
  error: null,
  initialized: false,
});

const createEmptyMediaLeaderboards = (): Record<LLMMediaType, MediaLeaderboardState> => ({
  'text-to-image': createMediaState(),
  'image-editing': createMediaState(),
  'text-to-speech': createMediaState(),
  'text-to-video': createMediaState(),
  'image-to-video': createMediaState(),
});

const mediaTypeConfig: Record<LLMMediaType, { label: string; description: string; hasCategories: boolean }> = {
  'text-to-image': {
    label: '텍스트 → 이미지',
    description: '프롬프트 기반 이미지 생성 모델 성능을 비교합니다.',
    hasCategories: true,
  },
  'image-editing': {
    label: '이미지 편집',
    description: '이미지 편집 및 변환 모델 성능을 비교합니다.',
    hasCategories: false,
  },
  'text-to-speech': {
    label: '텍스트 → 음성',
    description: '텍스트 음성 변환(TTS) 모델 성능을 비교합니다.',
    hasCategories: false,
  },
  'text-to-video': {
    label: '텍스트 → 비디오',
    description: '프롬프트 기반 비디오 생성 모델 성능을 비교합니다.',
    hasCategories: true,
  },
  'image-to-video': {
    label: '이미지 → 비디오',
    description: '이미지 기반 비디오 생성 모델 성능을 비교합니다.',
    hasCategories: true,
  },
};

const makeBenchmarkGroupId = (group: BenchmarkCategoryGroup) => `benchmark-${group.toLowerCase()}`;

const mediaFlowConfig: Record<
  LLMMediaType,
  {
    from: string;
    to: string;
    helper: string;
    accentClass: string;
    dotClass: string;
  }
> = {
  'text-to-image': {
    from: 'Text',
    to: 'Image',
    helper: '프롬프트 → 이미지',
    accentClass: 'from-sky-500/20 via-sky-500/10 to-transparent',
    dotClass: 'bg-sky-400',
  },
  'image-editing': {
    from: 'Image',
    to: 'Edit',
    helper: '이미지 → 편집',
    accentClass: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    dotClass: 'bg-emerald-400',
  },
  'text-to-speech': {
    from: 'Text',
    to: 'Voice',
    helper: '텍스트 → 음성',
    accentClass: 'from-purple-500/20 via-purple-500/10 to-transparent',
    dotClass: 'bg-purple-400',
  },
  'text-to-video': {
    from: 'Text',
    to: 'Video',
    helper: '텍스트 → 비디오',
    accentClass: 'from-amber-500/20 via-amber-500/10 to-transparent',
    dotClass: 'bg-amber-400',
  },
  'image-to-video': {
    from: 'Image',
    to: 'Video',
    helper: '이미지 → 비디오',
    accentClass: 'from-rose-500/20 via-rose-500/10 to-transparent',
    dotClass: 'bg-rose-400',
  },
};

const toNumber = (value?: number | string | null) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatScore = (score?: number | string | null, digits: number = 1) => {
  const numericScore = toNumber(score);
  if (numericScore === null) return '-';
  return numericScore.toFixed(digits);
};

const useCountUp = (target: number | null, durationMs: number = 1800) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === null) return;
    const from = 0;
    setValue(0);
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (target - from) * eased);
      setValue(next);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  if (target === null) return null;
  return value;
};

type BenchmarkCardProps = {
  benchmark: LLMBenchmarkResponse;
  groupLabel: string;
  state?: BenchmarkLeaderboardState;
};

type ProviderTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: number | string };
  dataMap: Map<number, { logo: string; label: string }>;
};

const BenchmarkCard = ({ benchmark, groupLabel, state }: BenchmarkCardProps) => {
  const entries = state?.entries ?? [];
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;

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
    if (x === undefined || y === undefined || !payload?.value) return null;
    const rankValue = Number(payload.value);
    if (!Number.isFinite(rankValue)) return null;
    const provider = dataMap.get(rankValue);
    if (!provider) return null;

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">{groupLabel}</p>
          <h3 className="text-base font-semibold text-text-primary mt-1">{benchmark.displayName}</h3>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{benchmark.description}</p>
        </div>
        <div className="text-xs text-text-muted text-right">
          {loading ? '불러오는 중' : `${entries.length.toLocaleString()} 모델`}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-lg border border-surface-border bg-surface-elevated/60 p-2">
          <p className="text-[10px] text-text-muted">모델 수</p>
          <p className="text-sm font-semibold text-text-primary mt-1">
            {loading ? '-' : entries.length.toLocaleString()}
          </p>
        </div>
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
                tick={(props) => renderProviderTick({ ...props, dataMap: providerMap })}
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
                formatter={(value: number | string, _name, props) => {
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
};

type MediaRankingCardProps = {
  mediaType: LLMMediaType;
  config: { label: string; description: string; hasCategories: boolean };
  flow: {
    from: string;
    to: string;
    helper: string;
    accentClass: string;
    dotClass: string;
  };
  state?: MediaLeaderboardState;
};

const MediaRankingCard = ({ mediaType, config, flow, state }: MediaRankingCardProps) => {
  const items = state?.items ?? [];
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;
  const totalLabel = state?.initialized ? state.totalElements.toLocaleString() : '-';

  const chartData = items
    .map((model) => {
      const providerName = model.modelCreator?.name || 'Unknown';
      const providerInfo = getProviderInfo(providerName);
      return {
        rank: model.rank,
        elo: toNumber(model.elo),
        modelName: model.name,
        providerName,
        providerLogo: providerInfo.logo,
        providerColor: providerInfo.color ?? '#58a6ff',
      };
    })
    .filter(
      (entry): entry is {
        rank: number;
        elo: number;
        modelName: string;
        providerName: string;
        providerLogo: string;
        providerColor: string;
      } => entry.elo !== null
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
    if (x === undefined || y === undefined || !payload?.value) return null;
    const rankValue = Number(payload.value);
    if (!Number.isFinite(rankValue)) return null;
    const provider = dataMap.get(rankValue);
    if (!provider) return null;

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

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary mt-1">{config.label}</h3>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{config.description}</p>
        </div>
        <div className="text-xs text-text-muted text-right">
          {loading ? '불러오는 중' : `${totalLabel} 모델`}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-xl border border-surface-border bg-surface-elevated/70 flex items-center justify-center text-xs text-text-secondary">
            {flow.from}
          </div>
          <span className="text-[10px] text-text-muted">Input</span>
        </div>
        <div className="flex-1">
          <div className={`flow-line bg-gradient-to-r ${flow.accentClass}`}>
            <span className={`flow-dot flow-dot-slow ${flow.dotClass}`} />
          </div>
          <p className="mt-2 text-[10px] text-text-muted text-center">ELO 비교</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-xl border border-surface-border bg-surface-elevated/70 flex items-center justify-center text-xs text-text-secondary">
            {flow.to}
          </div>
          <span className="text-[10px] text-text-muted">Output</span>
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="rank"
                tick={(props) => renderProviderTick({ ...props, dataMap: providerMap })}
                interval={0}
                axisLine={false}
                tickLine={false}
                height={30}
              />
              <YAxis
                tick={{ fill: '#8b949e', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={32}
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
                formatter={(value: number | string, _name, props) => {
                  const label = props?.payload?.modelName ?? '';
                  const numericValue = typeof value === 'number' ? value : Number(value);
                  const formattedValue = Number.isFinite(numericValue)
                    ? numericValue.toFixed(0)
                    : String(value);
                  return [`${formattedValue} ELO`, label];
                }}
                labelFormatter={() => 'ELO'}
              />
              <Bar dataKey="elo" radius={[6, 6, 0, 0]} barSize={20}>
                {chartData.map((entry) => (
                  <Cell key={entry.rank} fill={entry.providerColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-32 flex items-center justify-center text-xs text-text-muted">랭킹 불러오는 중...</div>
        ) : error ? (
          <div className="h-20 flex items-center justify-center text-xs text-text-muted">랭킹을 불러오지 못했습니다.</div>
        ) : items.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-xs text-text-muted">데이터가 없습니다</div>
        ) : (
          <div className="divide-y divide-surface-border">
            {chartData.map((entry) => (
              <div key={`${mediaType}-${entry.rank}`} className="flex items-center gap-3 py-2">
                <span className="w-7 text-xs font-mono text-text-muted">
                  {String(entry.rank).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{entry.modelName}</p>
                  <p className="text-xs text-text-muted truncate">{entry.providerName}</p>
                </div>
                <span className="text-xs font-semibold text-text-secondary">
                  {formatScore(entry.elo, 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function LLMRankingsPage() {
  const { isAuthenticated } = useAuth();
  const [tickerArticles, setTickerArticles] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('llm-benchmarks');

  const [benchmarks, setBenchmarks] = useState<LLMBenchmarkResponse[]>([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState(true);
  const [benchmarkLeaderboards, setBenchmarkLeaderboards] = useState<Record<BenchmarkType, BenchmarkLeaderboardState>>(
    {} as Record<BenchmarkType, BenchmarkLeaderboardState>
  );
  const fetchedLeaderboardsRef = useRef<Record<string, boolean>>({});
  const mediaTypeKeys = useMemo(() => Object.keys(mediaTypeConfig) as LLMMediaType[], []);
  const fetchedMediaRef = useRef<Record<string, boolean>>({});

  const [mediaLeaderboards, setMediaLeaderboards] = useState<Record<LLMMediaType, MediaLeaderboardState>>(
    createEmptyMediaLeaderboards()
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setIsPageLoading(true);
        const tickerData = await getTrendingTicker();
        setTickerArticles(tickerData);
      } catch (error) {
        console.error('Failed to fetch ticker:', error);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchPageData();
  }, []);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        setBenchmarkLoading(true);
        setBenchmarks([]);
        setBenchmarkLeaderboards({} as Record<BenchmarkType, BenchmarkLeaderboardState>);
        fetchedLeaderboardsRef.current = {};
        setMediaLeaderboards(createEmptyMediaLeaderboards());
        fetchedMediaRef.current = {};

        const benchmarkData = isAuthenticated
          ? await getAllLLMBenchmarks()
          : await getLLMBenchmarksByGroup('Composite');
        setBenchmarks(benchmarkData);
      } catch (error) {
        console.error('Failed to fetch benchmarks:', error);
      } finally {
        setBenchmarkLoading(false);
      }
    };

    fetchBenchmarks();
  }, [isAuthenticated]);

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

  const tocSections = useMemo(() => {
    const sections: { id: string; label: string }[] = [
      { id: 'llm-benchmarks', label: 'LLM 벤치마크' },
    ];

    (Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).forEach((group) => {
      const groupBenchmarks = groupedBenchmarks[group];
      if (!groupBenchmarks || groupBenchmarks.length === 0) return;
      sections.push({ id: makeBenchmarkGroupId(group), label: benchmarkCategoryConfig[group].labelKo });
    });

    if (isAuthenticated) {
      sections.push({ id: 'media-rankings', label: '미디어' });
    }
    return sections;
  }, [groupedBenchmarks, isAuthenticated]);

  useEffect(() => {
    if (tocSections.length === 0) return;
    const elements = tocSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topEntry = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        setActiveSection(topEntry.target.id);
      },
      { rootMargin: '0px 0px -60% 0px', threshold: [0.1, 0.25, 0.6] }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [tocSections]);

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

  const fetchMediaLeaderboard = useCallback(async (mediaType: LLMMediaType) => {
    setMediaLeaderboards((prev) => ({
      ...prev,
      [mediaType]: {
        ...prev[mediaType],
        loading: true,
        error: null,
      },
    }));

    try {
      const data = await getLLMMediaLeaderboard(mediaType, 0, 10, 'rank,asc');
      setMediaLeaderboards((prev) => {
        return {
          ...prev,
          [mediaType]: {
            ...prev[mediaType],
            items: data.content,
            page: data.number,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            last: data.last,
            loading: false,
            initialized: true,
          },
        };
      });
    } catch (error) {
      console.error('Failed to fetch media leaderboard:', error);
      setMediaLeaderboards((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          loading: false,
          error: '랭킹 데이터를 불러오지 못했습니다.',
          initialized: true,
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    mediaTypeKeys.forEach((mediaType) => {
      if (fetchedMediaRef.current[mediaType]) return;
      fetchedMediaRef.current[mediaType] = true;
      fetchMediaLeaderboard(mediaType);
    });
  }, [mediaTypeKeys, fetchMediaLeaderboard, isAuthenticated]);

  const mediaAggregate = useMemo(() => {
    let total = 0;
    let initializedCount = 0;

    mediaTypeKeys.forEach((mediaType) => {
      const state = mediaLeaderboards[mediaType];
      if (state?.initialized) {
        initializedCount += 1;
        total += state.totalElements;
      }
    });

    return {
      total,
      ready: initializedCount === mediaTypeKeys.length,
    };
  }, [mediaLeaderboards, mediaTypeKeys]);
  const llmModelCount = benchmarkLoading ? null : llmAggregate.modelCount;
  const llmProviderCount = benchmarkLoading ? null : llmAggregate.providerCount;
  const mediaModelCount = mediaAggregate.ready && isAuthenticated ? mediaAggregate.total : null;
  const llmModelCountAnimated = useCountUp(llmModelCount);
  const llmProviderCountAnimated = useCountUp(llmProviderCount);
  const mediaModelCountAnimated = useCountUp(mediaModelCount);
  const llmModelCountLabel = llmModelCountAnimated !== null ? llmModelCountAnimated.toLocaleString() : '-';
  const llmProviderCountLabel = llmProviderCountAnimated !== null ? llmProviderCountAnimated.toLocaleString() : '-';
  const mediaTotalLabel = mediaModelCountAnimated !== null ? mediaModelCountAnimated.toLocaleString() : '-';

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        <div
          className="fixed top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden xl:flex items-center"
          style={{ right: 'max(1.5rem, calc((100vw - 98rem) / 4))' }}
        >
          <div className="w-full px-4">
            <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-4 shadow-soft">
              <nav className="mt-4 space-y-2">
                {tocSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`block text-sm transition-colors ${
                      activeSection === section.id
                        ? 'text-accent font-semibold'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="lg:ml-52 xl:mr-52 border-b border-surface-border/50">
          <TrendingTicker articles={tickerArticles} />
        </div>

        <main className="lg:ml-52 xl:mr-52 pt-8 pb-16 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto space-y-12 relative z-10">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                홈으로
              </Link>

              <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-card/80 p-6 shadow-soft">
                <div className="absolute -top-28 right-0 h-72 w-72 rounded-full bg-gradient-radial from-accent/30 to-transparent blur-3xl" />
                <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <AIIcon className="w-6 h-6 text-text-secondary" />
                      <h1 className="text-3xl font-semibold text-text-primary">LLM 랭킹</h1>
                    </div>
                    <p className="text-sm text-text-secondary max-w-2xl">
                      벤치마크별 상위 10개 모델과 그래프를 한 화면에서 확인하세요.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 text-xs text-text-muted">
                      {['#AI', '#AGI', '#LLM', '#Benchmarks', '#Multimodal', '#ELO'].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-surface-elevated/60 border border-surface-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-1 ${isAuthenticated ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 min-w-[240px]`}
                  >
                    <div className="rounded-2xl border border-surface-border bg-surface-elevated/60 p-4">
                      <p className="text-xs text-text-muted">LLM 모델 수</p>
                      <p className="text-2xl font-semibold text-text-primary mt-2">
                        {llmModelCountLabel}
                      </p>
                      <p className="text-xs text-text-muted mt-1">전체 벤치마크 기준</p>
                    </div>
                    {isAuthenticated && (
                      <div className="rounded-2xl border border-surface-border bg-surface-elevated/60 p-4">
                        <p className="text-xs text-text-muted">미디어 모델 수</p>
                        <p className="text-2xl font-semibold text-text-primary mt-2">
                          {mediaTotalLabel}
                        </p>
                        <p className="text-xs text-text-muted mt-1">전체 미디어 유형 합산</p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-surface-border bg-surface-elevated/60 p-4">
                      <p className="text-xs text-text-muted">제공사 수</p>
                      <p className="text-2xl font-semibold text-text-primary mt-2">
                        {llmProviderCountLabel}
                      </p>
                      <p className="text-xs text-text-muted mt-1">LLM providers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isPageLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-14">
                <section id="llm-benchmarks" className="space-y-8 scroll-mt-24">
                  {(Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).map((group) => {
                    const groupBenchmarks = groupedBenchmarks[group];
                    if (!groupBenchmarks || groupBenchmarks.length === 0) return null;
                    const groupMeta = benchmarkCategoryConfig[group];

                    return (
                      <div key={group} id={makeBenchmarkGroupId(group)} className="space-y-4 scroll-mt-24">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-muted uppercase tracking-widest">{groupMeta.label}</p>
                            <h3 className="text-lg font-semibold text-text-primary">{groupMeta.labelKo}</h3>
                          </div>
                          <span className="text-xs text-text-muted">{groupBenchmarks.length} benchmarks</span>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-3">
                          {groupBenchmarks.map((benchmark) => {
                            const benchmarkType = benchmark.benchmarkType as BenchmarkType;
                            return (
                              <BenchmarkCard
                                key={benchmark.benchmarkType}
                                benchmark={benchmark}
                                groupLabel={groupMeta.labelKo}
                                state={benchmarkLeaderboards[benchmarkType]}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {!isAuthenticated && (
                    <div className="relative py-10">
                      <div className="grid gap-6 lg:grid-cols-3 opacity-30 blur-sm">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={`locked-benchmark-${i}`}
                            className="bg-surface-card rounded-2xl p-6 border border-surface-border"
                          >
                            <div className="h-3 bg-surface-hover rounded w-1/3 mb-4" />
                            <div className="h-4 bg-surface-hover rounded w-2/3 mb-2" />
                            <div className="h-4 bg-surface-hover rounded w-1/2 mb-4" />
                            <div className="h-24 bg-surface-hover rounded" />
                          </div>
                        ))}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-surface-card/95 backdrop-blur-xl rounded-2xl p-10 border border-surface-border shadow-soft max-w-md w-full text-center">
                          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>

                          <h3 className="text-xl font-medium text-text-primary mb-2">
                            더 많은 벤치마크 확인하기
                          </h3>

                          <p className="text-sm text-text-muted mb-6">
                            로그인하고 더 많은 벤치마크 랭킹을 확인하세요
                          </p>

                          <Link
                            to="/login"
                            className="block w-full py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors"
                          >
                            로그인
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {isAuthenticated && (
                  <section id="media-rankings" className="space-y-6 scroll-mt-24">
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">미디어 모델 랭킹</h2>
                      <p className="text-sm text-text-muted mt-1">
                        미디어 모델은 벤치마크 점수가 아니라 ELO 기반 상대 평가입니다. 모델 간 비교에서
                        우수한 결과를 낼수록 점수가 상승합니다.
                      </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      {mediaTypeKeys.map((mediaType) => (
                        <MediaRankingCard
                          key={mediaType}
                          mediaType={mediaType}
                          config={mediaTypeConfig[mediaType]}
                          flow={mediaFlowConfig[mediaType]}
                          state={mediaLeaderboards[mediaType]}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <div id="data-source" className="flex justify-center scroll-mt-24">
                  <p className="text-xs text-text-muted">
                    Data provided by{' '}
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
            )}
          </div>
        </main>
      </div>

      <footer className="lg:ml-52 xl:mr-52 border-t border-surface-border mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-0.5 mb-2">
                <span className="text-lg font-semibold text-text-primary">devport</span>
                <span className="text-accent text-lg font-semibold">.</span>
              </div>
              <p className="text-sm text-text-muted">개발자를 위한 글로벌 트렌드 포털</p>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">About</a>
              <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">Privacy</a>
              <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">Terms</a>
              <a href="#" className="text-text-muted hover:text-text-secondary transition-colors">Contact</a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-surface-border">
            <p className="text-xs text-text-muted text-center">
              © 2025 devport.kr
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
