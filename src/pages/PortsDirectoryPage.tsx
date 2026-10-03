import { useState, useEffect, useMemo } from 'react';
import { PortfolioPage } from '../components/ui/starfall-portfolio-landing';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';
import type { WikiProjectSummary } from '../services/wiki/wikiService';
import { getWikiProjects } from '../services/wiki/wikiService';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlobalWikiChatPanel from '../components/wiki/GlobalWikiChatPanel';

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k';
  return String(n);
}

// ─── Page ───────────────────────────────────────────────────

export default function PortsDirectoryPage() {
  const navigate = useNavigate();

  // Directory data
  const [wikiProjects, setWikiProjects] = useState<WikiProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Load flat project list for directory view
  useEffect(() => {
    setProjectsLoading(true);
    getWikiProjects()
      .then(res => setWikiProjects(res.projects))
      .catch(() => setWikiProjects([]))
      .finally(() => setProjectsLoading(false));
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return wikiProjects;
    const q = searchQuery.toLowerCase();
    return wikiProjects.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.language?.toLowerCase().includes(q)
    );
  }, [wikiProjects, searchQuery]);


  const goProject = (externalId: string) => {
    // Encode the full externalId (e.g. github:12345 → github%3A12345).
    // No slash in numeric IDs, so the wildcard route captures it cleanly.
    navigate(`/ports/${encodeURIComponent(externalId)}`);
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 hidden lg:block w-52`}
        >
          <Sidebar compact={false} />
        </div>

        {/* ─── DIRECTORY VIEW (LANDING PAGE) ── */}
        <main className="lg:ml-52 text-text-primary">
          {/* Aurora landing — full viewport hero */}
          <PortfolioPage
            hero={{
              titleLine1: '바이브 코더들을 위한 허브',
              titleLine2Gradient: 'Ports',
              subtitle: <>매일 쏟아지는 AI 프로젝트들, <span className="font-mono font-medium text-accent">portki</span>가 대신 확인하고 정리해드립니다.</>,
              subtitleBottom: <>가장 중요한 정보만 확인하고 <span className="font-medium text-accent">챗봇</span>을 통해 궁금한 것을 물어보세요.</>,
            }}
            showAnimatedBackground={true}
          />

          {/* PORTS PROJECT LIST */}
          <div id="ports-list" className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-20">
            <div className="flex flex-col max-w-3xl mx-auto mb-12 gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.01em] text-text-primary">프로젝트 둘러보기</h2>
                </div>
                {!projectsLoading && (
                  <p className="text-xs text-text-muted tabular-nums">
                    프로젝트 {searchQuery ? `${filteredProjects.length} / ${wikiProjects.length}` : wikiProjects.length}개
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="프로젝트 이름, 설명, 언어로 검색..."
                    aria-label="프로젝트 검색"
                    className="input h-14 pl-12 pr-10 text-base bg-surface-card"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      aria-label="검색어 지우기"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (window.innerWidth >= 640) {
                      setIsChatExpanded(true);
                    } else {
                      navigate('/ports/chat');
                    }
                  }}
                  className="btn btn-primary h-14 px-6 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  portki 챗봇
                </button>
              </div>
            </div>

            {projectsLoading ? (
              <div className="flex items-center justify-center py-24 text-sm text-text-muted">
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2.5" />
                프로젝트 불러오는 중
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-24 text-text-muted bg-surface-card/60 rounded border border-dashed border-surface-border-strong">
                {searchQuery ? `"${searchQuery}"에 대한 결과가 없습니다` : '등록된 프로젝트가 없습니다'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((p) => {
                  const owner = p.fullName.split('/')[0];
                  const avatarUrl = `https://github.com/${owner}.png?size=100`;

                  return (
                    <button
                      key={p.projectExternalId}
                      onClick={() => goProject(p.projectExternalId)}
                      className="group flex flex-col bg-surface-card/80 backdrop-blur-sm rounded border border-surface-border p-5 hover:bg-surface-hover/80 hover:border-surface-border-strong transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 shrink-0 rounded border border-surface-border bg-surface-elevated overflow-hidden">
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[11px] text-text-muted truncate">{owner}</p>
                          <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                            {p.fullName.split('/')[1] ?? p.fullName}
                          </h3>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {p.description ? (
                          <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">{p.description}</p>
                        ) : (
                          <p className="text-sm text-text-muted mb-4 min-h-[2.5rem]">설명이 없습니다</p>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-dashed border-surface-border-strong flex items-center justify-between gap-3 font-mono text-[11px] text-text-muted">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex items-center gap-1 text-text-secondary tabular-nums">
                            <svg className="w-3.5 h-3.5 text-signal" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            {p.stars != null ? fmt(p.stars) : '—'}
                          </span>
                          {p.language && <span className="truncate uppercase tracking-[0.04em]">{p.language}</span>}
                        </div>
                        <svg className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Global Chat Slide-out Panel (desktop only) */}
        <aside
          className={`fixed right-0 top-16 h-[calc(100vh-4rem)] pt-6 pb-6 px-5 border-l border-surface-border hidden sm:flex flex-col bg-surface/95 backdrop-blur-xl z-50 transition-transform duration-300 ease-in-out w-[450px] 2xl:w-[550px] shadow-overlay ${isChatExpanded ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="flex justify-between items-center mb-5 px-1">
            <div>
              <h3 className="font-semibold text-text-primary text-lg flex items-center gap-2">
                <MessageSquareText className="w-[18px] h-[18px] text-accent" strokeWidth={1.75} aria-hidden="true" />
                portki 챗봇
              </h3>
            </div>
            <button
              onClick={() => setIsChatExpanded(false)}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-h-0 relative rounded overflow-hidden border border-surface-border">
            <GlobalWikiChatPanel />
          </div>
        </aside>

      </div>
      <Footer className="lg:ml-52" />
    </div>
  );
}
