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
import type { LLMMediaType } from '../../../services/llm/llmService';
import type { MediaLeaderboardState, ProviderTickProps } from '../types';
import { toNumber, formatScore } from '../utils';
import { getProviderInfo } from '../../../config/providerLogos';

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

export default function MediaRankingCard({ mediaType, config, flow, state }: MediaRankingCardProps) {
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

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 shadow-soft min-w-0 overflow-hidden">
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
          <div className="h-full w-full overflow-x-auto scrollbar-minimal">
            <div className="h-full min-w-[280px] sm:min-w-[340px]">
              <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
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
                formatter={(value: number | string, _name: string, props: any) => {
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
            </div>
          </div>
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
}
