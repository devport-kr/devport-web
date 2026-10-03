import AIIcon from '../../../components/icons/AIIcon';

type RankingsOverviewCardProps = {
  llmModelCountLabel: string;
  llmProviderCountLabel: string;
  mediaTotalLabel: string;
};

export default function RankingsOverviewCard({
  llmModelCountLabel,
  llmProviderCountLabel,
  mediaTotalLabel,
}: RankingsOverviewCardProps) {
  const stats = [
    { label: 'LLM 모델', value: llmModelCountLabel, note: '전체 벤치마크 기준' },
    { label: '미디어 모델', value: mediaTotalLabel, note: '전체 미디어 유형 합산' },
    { label: '제공사', value: llmProviderCountLabel, note: 'LLM 제공사 기준' },
  ];

  return (
    <div className="panel overflow-hidden">
      <div className="p-6 lg:p-8">
        <h1 className="flex items-center gap-2.5 text-3xl font-semibold tracking-[-0.02em] text-text-primary">
          <AIIcon className="w-6 h-6 text-text-secondary" />
          LLM 랭킹
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
          벤치마크별 상위 10개 모델과 그래프를 한 화면에서 확인하세요.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 font-mono text-[11px] text-text-muted">
          {['AI', 'AGI', 'LLM', 'Benchmarks', 'Multimodal', 'ELO'].map((tag) => (
            <span key={tag}>
              <span className="text-surface-border-strong">#</span>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 border-t border-surface-border divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 py-4 bg-surface-elevated/50">
            <dt className="caption">{stat.label}</dt>
            <dd className="mt-1.5 font-mono text-2xl font-semibold text-text-primary tabular-nums">{stat.value}</dd>
            <dd className="mt-0.5 text-xs text-text-muted">{stat.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
