import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type {
  Port,
  ProjectSummary,
  ProjectDetail,
  ProjectEvent,
  EventType,
  HotRelease,
  PortDetailResponse,
  StarHistoryPoint,
  ProjectOverview,
  ProjectCommentTreeNode,
} from '../types';
import type { WikiSnapshot } from '../types/wiki';
import {
  getPorts,
  getPortBySlug,
  getProjectById,
  getProjectEvents,
  getProjectStarHistory,
  getProjectOverview,
  getProjectComments,
} from '../services/ports/portsService';
import { getWikiSnapshot } from '../services/wiki/wikiService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CommentItem from '../components/CommentItem';
import WikiContentColumn from '../components/wiki/WikiContentColumn';
import WikiAnchorRail from '../components/wiki/WikiAnchorRail';
import WikiRightRail from '../components/wiki/WikiRightRail';

// ─── Helpers ─────────────────────────────────────────────────

const EVENT_TYPE: Record<EventType, { label: string; cls: string; dot: string }> = {
  FEATURE:  { label: 'Feature',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: '#22c55e' },
  FIX:      { label: 'Fix',      cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: '#3b82f6' },
  SECURITY: { label: 'Security', cls: 'bg-red-500/10 text-red-400 border-red-500/20',            dot: '#ef4444' },
  BREAKING: { label: 'Breaking', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20',   dot: '#f97316' },
  PERF:     { label: 'Perf',     cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',         dot: '#06b6d4' },
  MISC:     { label: 'Misc',     cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20',         dot: '#6b7280' },
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k';
  return String(n);
}

function ago(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  return `${d}일 전`;
}

function parseLinks(linksStr: string | undefined | null): { label: string; url: string }[] {
  if (!linksStr) return [];
  try {
    return JSON.parse(linksStr);
  } catch {
    return [];
  }
}

function buildCommentTree(comments: any[]): ProjectCommentTreeNode[] {
  const map = new Map<string, ProjectCommentTreeNode>();
  const roots: ProjectCommentTreeNode[] = [];

  comments.forEach(c => {
    map.set(c.id, { ...c, replies: [] });
  });

  comments.forEach(c => {
    const node = map.get(c.id)!;
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── Views ───────────────────────────────────────────────────

type ProjectTab = 'wiki' | 'activity' | 'comments';

export default function PortsPage() {
  const { portNumber, projectExternalId } = useParams<{ portNumber?: string; projectExternalId?: string }>();
  const navigate = useNavigate();
  const [eventFilter, setEventFilter] = useState<EventType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<ProjectTab>('wiki');

  // Directory data
  const [ports, setPorts] = useState<Port[]>([]);
  const [portsLoading, setPortsLoading] = useState(true);

  // Port detail data
  const [portDetail, setPortDetail] = useState<PortDetailResponse | null>(null);
  const [portLoading, setPortLoading] = useState(false);

  // Project detail data
  const [projectData, setProjectData] = useState<ProjectDetail | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectOverview, setProjectOverview] = useState<ProjectOverview | null>(null);
  const [starHistory, setStarHistory] = useState<StarHistoryPoint[]>([]);
  const [projectEvents, setProjectEvents] = useState<ProjectEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [comments, setComments] = useState<ProjectCommentTreeNode[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Wiki data
  const [wikiSnapshot, setWikiSnapshot] = useState<WikiSnapshot | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);

  // Determine current view from URL params
  const viewType = projectExternalId ? 'project' : portNumber ? 'port' : 'directory';

  // Load ports directory (always load for mapping port number to slug)
  useEffect(() => {
    setPortsLoading(true);
    getPorts()
      .then(setPorts)
      .catch(err => console.error('Failed to load ports:', err))
      .finally(() => setPortsLoading(false));
  }, []);

  // Find port by port number and load port detail
  const currentPort = ports.find(p => p.portNumber === Number(portNumber));

  useEffect(() => {
    if (currentPort) {
      setPortLoading(true);
      getPortBySlug(currentPort.slug)
        .then(setPortDetail)
        .catch(err => console.error('Failed to load port:', err))
        .finally(() => setPortLoading(false));
    }
  }, [currentPort]);

  // Find matched project summary from port detail
  const matchedSummary: ProjectSummary | undefined = useMemo(() => {
    if (viewType !== 'project' || !projectExternalId || !portDetail) return undefined;
    return portDetail.projects.find(
      p => p.id === projectExternalId || p.name === projectExternalId
    );
  }, [viewType, projectExternalId, portDetail]);

  // Load project detail by external_id
  useEffect(() => {
    if (viewType === 'project' && matchedSummary) {
      const projectId = matchedSummary.id;

      // Load project detail
      setProjectLoading(true);
      getProjectById(projectId)
        .then(setProjectData)
        .catch(err => console.error('Failed to load project:', err))
        .finally(() => setProjectLoading(false));

      // Load star history
      getProjectStarHistory(projectId)
        .then(setStarHistory)
        .catch(() => setStarHistory([]));

      // Load overview
      getProjectOverview(projectId)
        .then(setProjectOverview)
        .catch(() => setProjectOverview(null));

      // Load events
      setEventsLoading(true);
      getProjectEvents(projectId, undefined, 0, 50)
        .then(eventsResp => {
          // Handle both paginated { content: [...] } and direct array response
          const events = Array.isArray(eventsResp) ? eventsResp : eventsResp.content;
          setProjectEvents(events || []);
        })
        .catch(() => setProjectEvents([]))
        .finally(() => setEventsLoading(false));

      // Load comments
      setCommentsLoading(true);
      getProjectComments(projectId)
        .then(commentsData => setComments(buildCommentTree(commentsData)))
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));

      // Load wiki snapshot
      setWikiLoading(true);
      getWikiSnapshot(projectExternalId!)
        .then(wiki => setWikiSnapshot(wiki))
        .catch(err => {
          console.error('Failed to load wiki:', err);
          setWikiSnapshot(null);
        })
        .finally(() => setWikiLoading(false));
    }
  }, [viewType, matchedSummary, projectExternalId]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return projectEvents;
    return projectEvents.filter(e => e.eventTypes.includes(eventFilter));
  }, [projectEvents, eventFilter]);

  const goPort = (portNum: number) => {
    navigate(`/ports/${portNum}`);
    setEventFilter('all');
  };

  const goProject = (proj: ProjectSummary, portNum: number) => {
    navigate(`/ports/${portNum}/${proj.id}`);
    setEventFilter('all');
  };

  const goDir = () => navigate('/ports');

  // ─── Render ────────────────────────────────────────────────

  const port = portDetail?.port || null;
  const project = projectData;
  const summary = matchedSummary;
  const overview = projectOverview;
  const portProjects = portDetail?.projects || [];
  const hotReleases = portDetail?.hotReleases || [];

  // Find port for current project (fallback to currentPort from URL)
  const projectPort = currentPort || null;

  // Parse overview links (backend sends JSON string)
  const overviewLinks = useMemo(() => parseLinks(overview?.links), [overview?.links]);

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* ─── PROJECT DETAIL ── */}
        {viewType === 'project' && (
          <div className="lg:ml-52 min-h-[calc(100vh-4rem)]">
            {(!project || !projectPort || projectLoading || portLoading) ? (
              <div className="flex items-center justify-center py-24 text-text-muted">Loading project...</div>
            ) : (
            <>
            {/* Fixed right sidebar - Only for activity and comments tabs */}
            {(activeTab === 'activity' || activeTab === 'comments') && (
            <aside className="fixed right-0 top-16 w-[28%] min-w-[340px] max-w-[420px] h-[calc(100vh-4rem)] pt-8 pb-8 px-6 border-l border-surface-border/50 overflow-y-auto hidden xl:block bg-surface z-20 scrollbar-hide">
            <div className="space-y-4">
              {/* Star history chart */}
              {starHistory.length > 0 && (
                <div className="bg-surface-card rounded-xl border border-surface-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-text-secondary">Star History</h3>
                    <span className="text-2xs text-text-muted">
                      {starHistory[0]?.date} — {starHistory[starHistory.length - 1]?.date}
                    </span>
                  </div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={starHistory.filter(d => d.stars > 0)}>
                        <defs>
                          <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: '#8b949e' }}
                          tickFormatter={(v: string) => v.slice(0, 4)}
                          interval={11}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: '#8b949e' }}
                          tickFormatter={(v: number) => fmt(v)}
                          axisLine={false}
                          tickLine={false}
                          width={32}
                        />
                        <Tooltip
                          contentStyle={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: '8px', fontSize: '11px', color: '#f0f6fc' }}
                          labelStyle={{ color: '#8b949e' }}
                          formatter={(value: number) => [value.toLocaleString(), 'Stars']}
                        />
                        <Area
                          type="monotone"
                          dataKey="stars"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          fill="url(#starGrad)"
                          dot={false}
                          activeDot={{ r: 3, fill: '#f59e0b', stroke: '#0f1419', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border/50">
                    <div>
                      <div className="text-lg font-semibold text-text-primary">{fmt(project.stars)}</div>
                      <div className="text-2xs text-text-muted">total stars</div>
                    </div>
                    {summary?.starsWeekDelta != null && summary.starsWeekDelta > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-emerald-400">+{fmt(summary.starsWeekDelta)}</div>
                        <div className="text-2xs text-text-muted">this week</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick stats */}
              <div className="bg-surface-card rounded-xl border border-surface-border divide-y divide-surface-border">
                {[
                  project.contributors != null && { label: 'Contributors', value: String(project.contributors) },
                  project.forks != null && { label: 'Forks', value: fmt(project.forks) },
                  summary?.releases30d != null && { label: 'Releases / 30d', value: String(summary.releases30d) },
                  project.lastRelease && { label: 'Last release', value: ago(project.lastRelease) },
                ].filter((s): s is { label: string; value: string } => !!s).map(s => (
                  <div key={s.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-text-muted">{s.label}</span>
                    <span className="text-xs font-medium text-text-secondary">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {Array.isArray(project.tags) && project.tags.length > 0 && (
                <div className="bg-surface-card rounded-xl border border-surface-border p-4">
                  <h3 className="text-xs text-text-muted mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map(t => (
                      <span key={t} className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-hover">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
            )}

          {/* Main content */}
          <div className={`${(activeTab === 'activity' || activeTab === 'comments') ? 'xl:mr-[28%]' : ''} max-w-3xl mx-auto px-6 py-8`}>
            {projectLoading ? (
              <div className="text-center py-12 text-text-muted">Loading project...</div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-semibold text-text-primary mb-1">{project.fullName}</h1>
                    <p className="text-sm text-text-muted">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {fmt(project.stars)}
                    </span>
                    {project.language && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted">
                        <span className="w-2 h-2 rounded-full" style={{ background: project.languageColor }} />
                        {project.language}
                      </span>
                    )}
                    {project.license && (
                      <span className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted">
                        {project.license}
                      </span>
                    )}
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </a>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-6 border-b border-surface-border">
                  <button
                    onClick={() => setActiveTab('wiki')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'wiki'
                        ? 'text-accent border-accent'
                        : 'text-text-muted border-transparent hover:text-text-secondary'
                    }`}
                  >
                    Wiki
                    {wikiSnapshot && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-2xs bg-accent/10 text-accent rounded">
                        AI
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'activity'
                        ? 'text-accent border-accent'
                        : 'text-text-muted border-transparent hover:text-text-secondary'
                    }`}
                  >
                    활동
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'comments'
                        ? 'text-accent border-accent'
                        : 'text-text-muted border-transparent hover:text-text-secondary'
                    }`}
                  >
                    댓글
                    {comments.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-2xs bg-surface-elevated text-text-muted rounded">
                        {comments.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Content - Activity (Release timeline) */}
                {activeTab === 'activity' && (
                <>
                <div className="bg-surface-card rounded-xl border border-surface-border p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-text-secondary">릴리스</h2>
                    <div className="flex gap-0.5 bg-surface-elevated rounded-lg p-0.5">
                      <button
                        onClick={() => setEventFilter('all')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${eventFilter === 'all' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary'}`}
                      >
                        All
                      </button>
                      {(Object.keys(EVENT_TYPE) as EventType[]).map(t => (
                        <button
                          key={t}
                          onClick={() => setEventFilter(t)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${eventFilter === t ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                          {EVENT_TYPE[t].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {eventsLoading ? (
                    <div className="text-center py-8 text-text-muted text-sm">Loading releases...</div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-text-muted text-sm">No releases found</div>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-[3px] top-1 bottom-1 w-px bg-surface-border" />

                      {filteredEvents.map((ev) => {
                        const types = ev.eventTypes || [];
                        const dotColor = types.includes('SECURITY') ? EVENT_TYPE.SECURITY.dot
                          : types.includes('BREAKING') ? EVENT_TYPE.BREAKING.dot
                          : projectPort.accentColor;

                        return (
                          <div key={ev.id} className="relative pb-6 last:pb-0">
                            <div className="absolute -left-5 top-1 w-[7px] h-[7px] rounded-full border-2" style={{ borderColor: dotColor, background: '#0f1419' }}>
                              <div className="absolute inset-[1px] rounded-full" style={{ background: dotColor }} />
                            </div>

                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-mono text-xs font-semibold text-text-primary">{ev.version}</span>
                              <span className="text-2xs text-text-muted">{ev.releasedAt?.split('T')[0]}</span>
                              <div className="flex gap-1 ml-auto">
                                {(ev.eventTypes || []).map(t => EVENT_TYPE[t] && (
                                  <span key={t} className={`text-2xs px-1.5 py-0.5 rounded border ${EVENT_TYPE[t].cls}`}>
                                    {EVENT_TYPE[t].label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className="text-sm text-text-primary mb-2">{ev.summary}</p>

                            <ul className="space-y-1 mb-2">
                              {(ev.bullets || []).map((b, i) => (
                                <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                                  <span className="text-surface-border mt-0.5">·</span>
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="flex items-center gap-3 text-2xs text-text-muted">
                              {ev.sourceUrl && (
                                <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light transition-colors">릴리스 노트</a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-center mb-8">
                  <span className="text-2xs text-text-muted">릴리스 요약은 LLM으로 생성 · 원문 확인 필수</span>
                </div>
                </>
                )}

                {/* Tab Content - Wiki */}
                {activeTab === 'wiki' && (
                  <>
                    {wikiLoading ? (
                      <div className="text-center py-12 text-text-muted">Loading wiki...</div>
                    ) : !wikiSnapshot ? (
                      <div className="bg-surface-card rounded-xl border border-surface-border p-8 text-center">
                        <p className="text-sm text-text-muted mb-2">Wiki not available for this project</p>
                        <p className="text-xs text-text-muted">Check back later as we generate technical documentation</p>
                      </div>
                    ) : (
                      <div className="flex gap-6">
                        {/* Left Rail - Section Navigation */}
                        <aside className="w-48 shrink-0 sticky top-24 self-start hidden lg:block">
                          <WikiAnchorRail 
                            sections={['what', 'how', 'architecture'].filter(s => 
                              !wikiSnapshot.hiddenSections?.includes(s) && wikiSnapshot[s as keyof WikiSnapshot]
                            )}
                          />
                        </aside>

                        {/* Center - Wiki Content */}
                        <div className="flex-1 min-w-0">
                          <WikiContentColumn 
                            snapshot={wikiSnapshot}
                            visibleSections={['what', 'how', 'architecture'].filter(s => 
                              !wikiSnapshot.hiddenSections?.includes(s) && wikiSnapshot[s as keyof WikiSnapshot]
                            )}
                          />
                        </div>

                        {/* Right Rail - Chat + Activity/Releases */}
                        <aside className="w-80 shrink-0 sticky top-24 self-start hidden xl:block">
                          <WikiRightRail 
                            snapshot={wikiSnapshot}
                            projectExternalId={projectExternalId!}
                          />
                        </aside>
                      </div>
                    )}
                  </>
                )}

                {/* Tab Content - Comments (Discussion Section) */}
                {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                    <h2 className="text-sm font-medium text-text-secondary">토론</h2>
                    {comments.length > 0 && (
                      <span className="text-xs text-text-muted">{comments.length}개 댓글</span>
                    )}
                  </div>

                  {commentsLoading ? (
                    <div className="text-center py-8 text-text-muted text-sm">Loading comments...</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-2xs text-text-muted shrink-0">
                          ?
                        </div>
                        <div className="flex-1 bg-surface-elevated/50 border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-text-muted cursor-text hover:border-surface-border transition-colors">
                          이 프로젝트에 대해 의견을 공유하세요...
                        </div>
                      </div>

                      <div className="space-y-1">
                        {comments.map(thread => (
                          <CommentItem
                            key={thread.id}
                            comment={thread}
                            articleId="mock"
                            onReply={async () => {}}
                            onEdit={async () => {}}
                            onDelete={async () => {}}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                )}
              </>
            )}
          </div>
        </>
        )}
        </div>
        )}

        {/* Directory and port views */}
        {viewType !== 'project' && (
          <main className="lg:ml-52 max-w-[1100px] mx-auto px-6 py-8">
          {/* ─── DIRECTORY ──────────────────────────────────── */}
          {viewType === 'directory' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-text-primary tracking-tight mb-1">Ports</h1>
                <p className="text-sm text-text-muted">포트 번호로 분류된 오픈소스 커뮤니티</p>
              </div>

              {portsLoading ? (
                <div className="text-center py-12 text-text-muted">Loading ports...</div>
              ) : (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                  {ports.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => goPort(p.portNumber)}
                      className="w-full flex items-center gap-5 px-5 py-4 hover:bg-surface-hover/50 transition-colors text-left group"
                    >
                      <div className="w-24 shrink-0">
                        <span className="font-mono text-xl font-bold tracking-tighter" style={{ color: p.accentColor }}>
                          :{p.portNumber}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-text-primary group-hover:text-accent-light transition-colors">
                            {p.name}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate">{p.description}</p>
                      </div>

                      <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs text-text-muted">
                        <div className="text-right">
                          <div className="text-text-secondary font-medium">{p.projectCount}</div>
                          <div className="text-2xs">프로젝트</div>
                        </div>
                        <div className="text-right">
                          <div className="text-text-secondary font-medium">{p.recentReleaseCount}</div>
                          <div className="text-2xs">릴리스/30d</div>
                        </div>
                        <div className="w-16">
                          <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, (p.recentReleaseCount / 35) * 100)}%`, background: p.accentColor }}
                            />
                          </div>
                        </div>
                      </div>

                      <svg className="w-4 h-4 text-text-muted/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── PORT DETAIL ────────────────────────────────── */}
          {viewType === 'port' && port && (
            <div>
              {portLoading ? (
                <div className="text-center py-12 text-text-muted">Loading port...</div>
              ) : (
                <>
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-mono text-3xl font-bold tracking-tighter" style={{ color: port.accentColor }}>
                      :{port.portNumber}
                    </span>
                    <h1 className="text-xl font-semibold text-text-primary">{port.name}</h1>
                    <span className="text-sm text-text-muted">{port.description}</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Projects */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-medium text-text-secondary">프로젝트 ({portProjects.length})</h2>
                        <span className="text-xs text-text-muted">릴리스 기준 정렬</span>
                      </div>

                      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                        {[...portProjects].sort((a, b) => b.releases30d - a.releases30d).map((p, i) => (
                          <button
                            key={p.id}
                            onClick={() => goProject(p, port.portNumber)}
                            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-hover/50 transition-colors text-left group"
                          >
                            <span className={`text-xs font-mono w-5 shrink-0 ${i < 3 ? 'text-accent font-medium' : 'text-text-muted'}`}>
                              {String(i + 1).padStart(2, '0')}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-text-primary group-hover:text-accent-light transition-colors truncate">
                                  {p.fullName}
                                </span>
                                {p.language && (
                                  <span className="flex items-center gap-1 shrink-0">
                                    <span className="w-2 h-2 rounded-full" style={{ background: p.languageColor }} />
                                    <span className="text-2xs text-text-muted">{p.language}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-text-secondary">
                                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                  {fmt(p.stars)}
                                </div>
                                {p.starsWeekDelta > 0 && (
                                  <span className="text-2xs text-emerald-400">+{fmt(p.starsWeekDelta)}/wk</span>
                                )}
                              </div>
                              {p.sparklineData && p.sparklineData.length > 0 && (
                                <div className="w-14 h-6">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={p.sparklineData.map((v, j) => ({ v, j }))}>
                                      <defs>
                                        <linearGradient id={`sp-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor={port.accentColor} stopOpacity={0.3} />
                                          <stop offset="100%" stopColor={port.accentColor} stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <Area type="monotone" dataKey="v" stroke={port.accentColor} strokeWidth={1.5} fill={`url(#sp-${p.id})`} dot={false} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hot releases */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                        <h2 className="text-sm font-medium text-text-secondary">최근 릴리스</h2>
                      </div>

                      <div className="space-y-2">
                        {hotReleases.map((ev) => {
                          const proj = portProjects.find(p => p.name === ev.projectName);
                          return (
                            <div
                              key={ev.id}
                              onClick={() => proj && goProject(proj, port.portNumber)}
                              className="bg-surface-card rounded-xl border border-surface-border p-4 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-medium text-text-secondary">{ev.projectName}</span>
                                <span className="text-xs font-mono text-text-muted">{ev.version}</span>
                                <span className="text-2xs text-text-muted ml-auto">{ago(ev.releasedAt)}</span>
                              </div>
                              <p className="text-sm text-text-primary mb-2 line-clamp-2">{ev.summary}</p>
                              <div className="flex gap-1.5">
                                {(ev.eventTypes || []).map(t => EVENT_TYPE[t] && (
                                  <span key={t} className={`text-2xs px-1.5 py-0.5 rounded border ${EVENT_TYPE[t].cls}`}>
                                    {EVENT_TYPE[t].label}
                                  </span>
                                ))}
                                {ev.impactScore != null && ev.impactScore >= 80 && (
                                  <span className="text-2xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 ml-auto font-mono">
                                    {ev.impactScore}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          </main>
        )}
      </div>
    </div>
  );
}
