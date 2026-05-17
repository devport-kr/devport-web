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
  return (
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-[240px]">
          <div className="rounded-2xl border border-surface-border bg-surface-elevated/60 p-4">
            <p className="text-xs text-text-muted">LLM 모델 수</p>
            <p className="text-2xl font-semibold text-text-primary mt-2">
              {llmModelCountLabel}
            </p>
            <p className="text-xs text-text-muted mt-1">전체 벤치마크 기준</p>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-elevated/60 p-4">
            <p className="text-xs text-text-muted">미디어 모델 수</p>
            <p className="text-2xl font-semibold text-text-primary mt-2">
              {mediaTotalLabel}
            </p>
            <p className="text-xs text-text-muted mt-1">전체 미디어 유형 합산</p>
          </div>
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
  );
}
