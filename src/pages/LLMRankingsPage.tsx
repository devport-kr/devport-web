import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import TrendingTicker from '../components/TrendingTicker';
import type { BenchmarkCategoryGroup, BenchmarkType } from '../types';
import { benchmarkCategoryConfig } from '../types';
import { getTrendingTicker } from '../services/articles/articlesService';
import { useBenchmarkData } from './llm-rankings/hooks/useBenchmarkData';
import { useMediaLeaderboardData } from './llm-rankings/hooks/useMediaLeaderboardData';
import { makeBenchmarkGroupId, useCountUp } from './llm-rankings/utils';
import { mediaTypeConfig, mediaFlowConfig } from './llm-rankings/types';
import BenchmarkCard from './llm-rankings/components/BenchmarkCard';
import MediaRankingCard from './llm-rankings/components/MediaRankingCard';
import RankingsOverviewCard from './llm-rankings/components/RankingsOverviewCard';

export default function LLMRankingsPage() {
  const [tickerArticles, setTickerArticles] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('llm-benchmarks');

  const {
    benchmarkLoading,
    benchmarkLeaderboards,
    groupedBenchmarks,
    llmAggregate,
    benchmarkTocSections,
  } = useBenchmarkData();

  const {
    mediaTypeKeys,
    mediaLeaderboards,
    mediaAggregate,
  } = useMediaLeaderboardData();

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

  // TOC sections
  const tocSections = useMemo(() => {
    return [
      { id: 'llm-benchmarks', label: 'LLM 벤치마크' },
      ...benchmarkTocSections,
      { id: 'media-rankings', label: '미디어' },
    ];
  }, [benchmarkTocSections]);

  // IntersectionObserver for active TOC section
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

  // Animated aggregate counts
  const llmModelCount = benchmarkLoading ? null : llmAggregate.modelCount;
  const llmProviderCount = benchmarkLoading ? null : llmAggregate.providerCount;
  const mediaModelCount = mediaAggregate.ready ? mediaAggregate.total : null;
  const llmModelCountAnimated = useCountUp(llmModelCount);
  const llmProviderCountAnimated = useCountUp(llmProviderCount);
  const mediaModelCountAnimated = useCountUp(mediaModelCount);
  const llmModelCountLabel = llmModelCountAnimated !== null ? llmModelCountAnimated.toLocaleString() : '-';
  const llmProviderCountLabel = llmProviderCountAnimated !== null ? llmProviderCountAnimated.toLocaleString() : '-';
  const mediaTotalLabel = mediaModelCountAnimated !== null ? mediaModelCountAnimated.toLocaleString() : '-';

  return (
    <div className="min-h-screen bg-glow overflow-x-hidden">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* TOC Sidebar */}
        <div
          className="fixed top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden xl:flex items-center"
          style={{ right: 'max(1.5rem, calc((100vw - 98rem) / 4))' }}
        >
          <div className="w-full px-4">
            <div className="panel p-4">
              <p className="label-mono">목차</p>
              <nav className="mt-3 space-y-0.5 border-l border-surface-border" aria-label="목차">
                {tocSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    aria-current={activeSection === section.id ? 'location' : undefined}
                    className={`block -ml-px pl-3 py-1 text-sm border-l transition-colors ${
                      activeSection === section.id
                        ? 'text-text-primary font-medium border-accent'
                        : 'text-text-muted border-transparent hover:text-text-secondary'
                    }`}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="lg:ml-52 xl:mr-52 border-b border-surface-border">
          <TrendingTicker articles={tickerArticles} />
        </div>

        <main className="lg:ml-52 xl:mr-52 pt-8 px-4 md:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto space-y-12 relative z-10">
            {/* Back link + Overview card */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted hover:text-text-primary mb-6 transition-colors"
              >
                ← 홈으로
              </Link>

              <RankingsOverviewCard
                llmModelCountLabel={llmModelCountLabel}
                llmProviderCountLabel={llmProviderCountLabel}
                mediaTotalLabel={mediaTotalLabel}
              />
            </div>

            {isPageLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-14">
                {/* Benchmark sections */}
                <section id="llm-benchmarks" className="space-y-8 scroll-mt-24">
                  {(Object.keys(benchmarkCategoryConfig) as BenchmarkCategoryGroup[]).map((group) => {
                    const groupBenchmarks = groupedBenchmarks[group];
                    if (!groupBenchmarks || groupBenchmarks.length === 0) return null;
                    const groupMeta = benchmarkCategoryConfig[group];

                    return (
                      <div key={group} id={makeBenchmarkGroupId(group)} className="space-y-4 scroll-mt-24">
                        <div className="flex items-end justify-between pb-3 border-b border-dashed border-surface-border-strong">
                          <div>
                            <p className="label-mono">{groupMeta.label}</p>
                            <h3 className="mt-0.5 text-lg font-semibold text-text-primary">{groupMeta.labelKo}</h3>
                          </div>
                          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted tabular-nums">{groupBenchmarks.length} benchmarks</span>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
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
                </section>

                {/* Media rankings */}
                <section id="media-rankings" className="space-y-6 scroll-mt-24">
                  <div className="pb-3 border-b border-dashed border-surface-border-strong">
                    <p className="label-mono">Media · ELO</p>
                    <h2 className="mt-0.5 text-xl font-semibold text-text-primary">미디어 모델 랭킹</h2>
                    <p className="text-sm text-text-muted mt-1">
                      미디어 모델은 벤치마크 점수가 아니라 ELO 기반 상대 평가입니다. 모델 간 비교에서
                      우수한 결과를 낼수록 점수가 상승합니다.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
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

                {/* Data attribution */}
                <div id="data-source" className="flex justify-center scroll-mt-24">
                  <p className="font-mono text-[11px] text-text-muted">
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

      <Footer className="lg:ml-52 xl:mr-52" />
    </div>
  );
}
