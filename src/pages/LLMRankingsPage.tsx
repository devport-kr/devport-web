import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import TrendingTicker from '../components/TrendingTicker';
import type { BenchmarkCategoryGroup, BenchmarkType } from '../types';
import { benchmarkCategoryConfig } from '../types';
import { getTrendingTicker } from '../services/articles/articlesService';
import { useAuth } from '../contexts/AuthContext';
import { useBenchmarkData } from './llm-rankings/hooks/useBenchmarkData';
import { useMediaLeaderboardData } from './llm-rankings/hooks/useMediaLeaderboardData';
import { makeBenchmarkGroupId, useCountUp } from './llm-rankings/utils';
import { mediaTypeConfig, mediaFlowConfig } from './llm-rankings/types';
import BenchmarkCard from './llm-rankings/components/BenchmarkCard';
import MediaRankingCard from './llm-rankings/components/MediaRankingCard';
import RankingsOverviewCard from './llm-rankings/components/RankingsOverviewCard';

export default function LLMRankingsPage() {
  const { isAuthenticated } = useAuth();
  const [tickerArticles, setTickerArticles] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('llm-benchmarks');

  const {
    benchmarkLoading,
    benchmarkLeaderboards,
    groupedBenchmarks,
    llmAggregate,
    benchmarkTocSections,
  } = useBenchmarkData(isAuthenticated);

  const {
    mediaTypeKeys,
    mediaLeaderboards,
    mediaAggregate,
  } = useMediaLeaderboardData(isAuthenticated);

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
    const sections: { id: string; label: string }[] = [
      { id: 'llm-benchmarks', label: 'LLM 벤치마크' },
      ...benchmarkTocSections,
    ];

    if (isAuthenticated) {
      sections.push({ id: 'media-rankings', label: '미디어' });
    }
    return sections;
  }, [benchmarkTocSections, isAuthenticated]);

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
  const mediaModelCount = mediaAggregate.ready && isAuthenticated ? mediaAggregate.total : null;
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

        <main className="lg:ml-52 xl:mr-52 pt-8 pb-16 px-4 md:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto space-y-12 relative z-10">
            {/* Back link + Overview card */}
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

              <RankingsOverviewCard
                isAuthenticated={isAuthenticated}
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

                  {/* Unauthenticated lock overlay */}
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

                {/* Media rankings (authenticated only) */}
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

                {/* Data attribution */}
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

      <Footer className="lg:ml-52 xl:mr-52 pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  );
}
