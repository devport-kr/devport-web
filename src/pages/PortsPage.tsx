import { useState, useEffect, useMemo } from 'react';
import { PortfolioPage } from '../components/ui/starfall-portfolio-landing';
import { useParams, useNavigate } from 'react-router-dom';
import type {
  ProjectDetail,
  ProjectEvent,
  ProjectCommentTreeNode,
} from '../types';
import type { WikiSnapshot } from '../types/wiki';
import type { WikiProjectSummary } from '../services/wiki/wikiService';
import {
  getProjectById,
  getProjectEvents,
  getProjectComments,
} from '../services/ports/portsService';
import { getWikiSnapshot, getWikiProjects } from '../services/wiki/wikiService';

import Sidebar from '../components/Sidebar';
import CommentItem from '../components/CommentItem';
import WikiChatPanel from '../components/wiki/WikiChatPanel';
import WikiMarkdownRenderer, { MermaidCodeBlock } from '../components/wiki/WikiMarkdownRenderer';

// ─── Helpers ─────────────────────────────────────────────────

const EVENT_BADGE: Record<string, { label: string; cls: string }> = {
  FEATURE: { label: 'feat', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  FIX: { label: 'fix', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SECURITY: { label: 'sec', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  BREAKING: { label: 'break', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  PERF: { label: 'perf', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  MISC: { label: 'misc', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

interface TocSubsection {
  id: string;
  label: string;
  level: number;
}

interface TocSectionItem {
  id: string;
  label: string;
  children?: TocSubsection[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getWikiSubsectionTitles(metadata: Record<string, unknown> | null | undefined): string[] {
  if (!metadata || !Array.isArray(metadata.subsections)) return [];

  return metadata.subsections.flatMap((subsection) => {
    if (!isRecord(subsection)) return [];
    const title = typeof subsection.titleKo === 'string' ? subsection.titleKo.trim() : '';
    return title ? [title] : [];
  });
}

function cleanChildLabel(parentLabel: string, childLabel: string): string {
  const trimmedParent = parentLabel.trim();
  let label = childLabel.trim();

  if (!trimmedParent) return label;

  const escapedParent = trimmedParent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixes = [
    new RegExp(`^${escapedParent}\\s*[:\\-–—>→]\\s*`, 'i'),
    new RegExp(`^${escapedParent}\\s*/\\s*`, 'i'),
    new RegExp(`^${escapedParent}\\s*\\|\\s*`, 'i'),
    new RegExp(`^${escapedParent}\\s*\\s`, 'i'),
  ];

  for (const prefixRegex of prefixes) {
    label = label.replace(prefixRegex, '');
    if (label !== childLabel.trim()) break;
  }

  return label.trim() || childLabel.trim();
}

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

// ─── Page ───────────────────────────────────────────────────

export default function PortsPage() {
  // Use the wildcard `*` segment to capture fullName paths like "owner/repo"
  const params = useParams<{ '*': string }>();
  const fullNameFromUrl = params['*'] || '';
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('wiki-what');

  // Directory data
  const [wikiProjects, setWikiProjects] = useState<WikiProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Project detail data
  const [projectData, setProjectData] = useState<ProjectDetail | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectEvents, setProjectEvents] = useState<ProjectEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [comments, setComments] = useState<ProjectCommentTreeNode[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Wiki data
  const [wikiSnapshot, setWikiSnapshot] = useState<WikiSnapshot | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [tocSections, setTocSections] = useState<TocSectionItem[]>([]);

  const viewType = fullNameFromUrl ? 'project' : 'directory';

  // Load flat project list for directory view
  useEffect(() => {
    if (viewType !== 'directory') return;
    setProjectsLoading(true);
    getWikiProjects()
      .then(res => setWikiProjects(res.projects))
      .catch(() => setWikiProjects([]))
      .finally(() => setProjectsLoading(false));
  }, [viewType]);

  // The wildcard param holds the URL-encoded externalId (e.g. "github%3A12345").
  // Decode it to get the raw externalId ("github:12345") used by the backend.
  const decodedProjectExternalId = useMemo(() => {
    if (!fullNameFromUrl) return undefined;
    try {
      return decodeURIComponent(fullNameFromUrl);
    } catch {
      return fullNameFromUrl;
    }
  }, [fullNameFromUrl]);

  // Load project, events, comments, wiki by external ID
  useEffect(() => {
    if (viewType !== 'project' || !decodedProjectExternalId) return;

    // We need the numeric project ID for events/comments — try matching from directory
    // For project details we use the external ID directly via the wiki-snapshot
    setProjectLoading(true);
    // Try to load project detail using the externalId as the path param
    getProjectById(decodedProjectExternalId)
      .then(setProjectData)
      .catch(() => setProjectData(null))
      .finally(() => setProjectLoading(false));

    setEventsLoading(true);
    getProjectEvents(decodedProjectExternalId, undefined, 0, 50)
      .then(eventsResp => {
        const events = Array.isArray(eventsResp) ? eventsResp : eventsResp.content;
        setProjectEvents(events || []);
      })
      .catch(() => setProjectEvents([]))
      .finally(() => setEventsLoading(false));

    setCommentsLoading(true);
    getProjectComments(decodedProjectExternalId)
      .then(commentsData => setComments(buildCommentTree(commentsData)))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));

    setWikiLoading(true);
    getWikiSnapshot(decodedProjectExternalId)
      .then(wiki => setWikiSnapshot(wiki))
      .catch(err => {
        console.error('Failed to load wiki:', err);
        setWikiSnapshot(null);
      })
      .finally(() => setWikiLoading(false));
  }, [viewType, decodedProjectExternalId]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return wikiProjects;
    const q = searchQuery.toLowerCase();
    return wikiProjects.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.language?.toLowerCase().includes(q)
    );
  }, [wikiProjects, searchQuery]);

  const latestReleases = useMemo(() => projectEvents.slice(0, 5), [projectEvents]);

  // Visible wiki sections from dynamic sections array
  const visibleWikiSections = useMemo(() => {
    if (!wikiSnapshot?.sections?.length) return [];
    const hidden = wikiSnapshot.hiddenSections || [];
    return wikiSnapshot.sections.filter(s => !hidden.includes(s.sectionId));
  }, [wikiSnapshot]);

  const wikiGeneratedLabel = useMemo(() => {
    if (!wikiSnapshot?.generatedAt) return null;
    return new Date(wikiSnapshot.generatedAt).toLocaleString('ko-KR');
  }, [wikiSnapshot?.generatedAt]);

  // All TOC sections (wiki + activity + comments)
  useEffect(() => {
    let timeoutId: number;
    let rafId: number;

    const buildSections = () => {
      const sections: TocSectionItem[] = [];

      for (const ws of visibleWikiSections) {
        const sectionId = `wiki-${ws.sectionId}`;
        const sectionEl = document.getElementById(sectionId);
        const children: TocSubsection[] = [];
        const seenHeadingIds = new Set<string>();
        const subsectionTitles = getWikiSubsectionTitles(ws.metadata);

        if (sectionEl) {
          const headingEls = Array.from(sectionEl.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6'))
            .filter((headingEl) => {
              const id = headingEl.getAttribute('id');
              return Boolean(id && id.startsWith(`${sectionId}-deepdive-`));
            });

          for (const [index, headingEl] of headingEls.entries()) {
            const id = headingEl.getAttribute('id');
            const labelFromMetadata = subsectionTitles[index];
            const label = (labelFromMetadata || headingEl.textContent || '').trim();
            if (!id || !label) continue;
            const normalizedLabel = cleanChildLabel(ws.heading, label);
            if (!normalizedLabel || normalizedLabel === ws.heading) continue;
            if (normalizedLabel === ws.heading.trim()) continue;
            if (seenHeadingIds.has(id)) continue;

            const level = Number(headingEl.tagName.slice(1)) || 2;
            children.push({ id, label: normalizedLabel, level });
            seenHeadingIds.add(id);
          }
        }

        sections.push({
          id: sectionId,
          label: ws.heading,
          ...(children.length ? { children } : {}),
        });
      }

      sections.push({ id: 'activity', label: '활동' });
      sections.push({ id: 'comments', label: '댓글' });

      // Update TOC sections only if they actually changed (basic comparison)
      setTocSections(prev => {
        if (JSON.stringify(prev) === JSON.stringify(sections)) return prev;
        return sections;
      });
    };

    // Use a small delay to ensure DOM is ready after wiki content render
    timeoutId = window.setTimeout(() => {
      rafId = requestAnimationFrame(buildSections);
    }, 100);

    return () => {
      window.clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visibleWikiSections]);

  const tocAnchorIds = useMemo(() => {
    const ids: string[] = [];
    for (const section of tocSections) {
      ids.push(section.id);
      if (section.children?.length) {
        for (const child of section.children) {
          ids.push(child.id);
        }
      }
    }
    return ids;
  }, [tocSections]);

  const scrollToTocAnchor = (anchorId: string) => {
    const target =
      document.getElementById(anchorId)
      || document.querySelector<HTMLElement>(`[name="${CSS.escape ? CSS.escape(anchorId) : anchorId}"]`);

    if (!target) return;

    const destination = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - 88);

    window.scrollTo({
      top: destination,
      behavior: 'smooth',
    });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${anchorId}`);
  };

  useEffect(() => {
    if (tocAnchorIds.length === 0) return;

    const flattenedIds = tocAnchorIds;
    const hash = window.location.hash.replace(/^#/, '');

    if (hash && flattenedIds.includes(hash)) {
      setActiveSection(hash);
      return;
    }

    setActiveSection((prev) => (flattenedIds.includes(prev) ? prev : flattenedIds[0]));
  }, [tocAnchorIds]);

  useEffect(() => {
    if (tocAnchorIds.length === 0) return;

    let frameId = 0;

    const updateActiveFromScroll = () => {
      frameId = 0;

      const elements = tocAnchorIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element));

      if (elements.length === 0) return;

      const readerOffset = Math.max(140, Math.min(window.innerHeight * 0.28, 240));
      const scrollMarker = window.scrollY + readerOffset;
      const sortedAnchors = elements
        .map((element) => ({
          id: element.id,
          top: element.getBoundingClientRect().top + window.scrollY,
        }))
        .sort((left, right) => left.top - right.top);
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const current = isAtBottom
        ? sortedAnchors[sortedAnchors.length - 1]
        : sortedAnchors.filter((anchor) => anchor.top <= scrollMarker).at(-1) ?? sortedAnchors[0];

      setActiveSection((prev) => (prev === current.id ? prev : current.id));
    };

    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveFromScroll);
    };

    updateActiveFromScroll();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [tocAnchorIds]);


  const goProject = (externalId: string) => {
    // Encode the full externalId (e.g. github:12345 → github%3A12345).
    // No slash in numeric IDs, so the wildcard route captures it cleanly.
    navigate(`/ports/${encodeURIComponent(externalId)}`);
  };

  // ─── Render ────────────────────────────────────────────────

  const project = projectData;
  const isWikiStylePage = viewType === 'project';
  const sidebarOffsetClass = isWikiStylePage ? 'w-14' : 'w-52';
  const anchorOffsetClass = isWikiStylePage ? 'left-14' : 'left-52';

  return (
    <div className="min-h-screen bg-glow">
      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div
          className={`fixed left-0 top-0 h-screen z-40 hidden lg:block ${sidebarOffsetClass}`}
        >
          <Sidebar compact={isWikiStylePage} />
        </div>

        {/* ─── PROJECT DETAIL ── */}
        {viewType === 'project' && (
          <div className={`${isWikiStylePage ? 'lg:ml-14' : 'lg:ml-52'} min-h-screen`}>
            {(projectLoading) ? (
              <div className="flex items-center justify-center py-24 text-text-muted">Loading project...</div>
            ) : (
              <>
                {/* Fixed right sidebar - ALWAYS visible */}
                <aside className="fixed right-0 top-0 w-[320px] 2xl:w-[520px] h-screen pt-12 pb-6 px-5 border-l border-surface-border/50 hidden xl:flex flex-col bg-surface z-20">
                  {/* Chat Panel — fills remaining height */}
                  {decodedProjectExternalId && (
                    <div className="flex-1 min-h-0">
                      <WikiChatPanel projectExternalId={decodedProjectExternalId} />
                    </div>
                  )}
                </aside>

                {/* TOC Sidebar - Fixed next to global sidebar */}
                {tocSections.length > 0 && (
                  <div
                    className={`fixed ${anchorOffsetClass} top-0 w-56 h-screen z-30 hidden xl:block`}
                  >
                    <div className="h-full pl-4 pr-3 pt-12">
                      <nav className="space-y-0.5 border-l border-surface-border/80 pl-3 pr-1 text-left">
                        {tocSections.map((section) => (
                          <div key={section.id}>
                            {(() => {
                              const isActiveSection =
                                activeSection === section.id || (section.children || []).some((child) => child.id === activeSection);

                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setActiveSection(section.id);
                                    scrollToTocAnchor(section.id);
                                  }}
                                  className={`group relative block rounded-sm px-2 py-1.5 transition-colors ${isActiveSection
                                    ? 'font-medium text-text-primary bg-surface-elevated/45'
                                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated/20'
                                    }`}
                                >
                                  <span
                                    className={`absolute -left-[13px] top-1.5 bottom-1.5 w-[2px] rounded-full transition-colors ${isActiveSection ? 'bg-accent/80' : 'bg-transparent group-hover:bg-surface-border'
                                      }`}
                                  />
                                  <span className="block w-full text-left break-words text-[13px] leading-5">
                                    {section.label}
                                  </span>
                                </button>
                              );
                            })()}

                            {section.children && section.children.length > 0 && (
                              <div className="mt-0.5">
                                {section.children.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setActiveSection(child.id);
                                      scrollToTocAnchor(child.id);
                                    }}
                                    className={`group relative block rounded-sm px-2 py-1 transition-colors ${activeSection === child.id
                                      ? 'font-medium text-text-primary bg-surface-elevated/45'
                                      : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated/20'
                                      }`}
                                    style={{
                                      paddingLeft:
                                        child.level === 2
                                          ? '1.1rem'
                                          : child.level === 3
                                            ? '1.5rem'
                                            : child.level === 4
                                              ? '1.9rem'
                                              : child.level >= 5
                                                ? '2.3rem'
                                                : '1.1rem',
                                    }}
                                  >
                                    <span
                                      className={`absolute -left-[13px] top-1.5 bottom-1.5 w-[2px] rounded-full transition-colors ${activeSection === child.id ? 'bg-accent/80' : 'bg-transparent group-hover:bg-surface-border'
                                        }`}
                                    />
                                    <span className="block w-full text-left break-words text-[12px] leading-5">
                                      {child.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </nav>
                    </div>
                  </div>
                )}

                {/* Main content — centered between TOC and right rail */}
                <div className="xl:ml-56 xl:mr-[320px] 2xl:mr-[520px] px-6 py-12">
                  <div className="max-w-3xl mx-auto">
                    {projectLoading ? (
                      <div className="text-center py-12 text-text-muted">Loading project...</div>
                    ) : (
                      <>
                        {/* Header */}
                        {project && (
                          <div className="mb-10">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-start gap-4 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-xl border border-surface-border bg-surface-elevated overflow-hidden shrink-0">
                                  <img
                                    src={`https://github.com/${project.fullName.split('/')[0]}.png?size=100`}
                                    alt={project.fullName.split('/')[0]}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h1 className="text-2xl font-semibold text-text-primary mb-2">{project.fullName}</h1>
                                  {Array.isArray(project.tags) && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 overflow-hidden">
                                      {project.tags.slice(0, 12).map((tag) => (
                                        <span key={tag} className="text-2xs text-text-muted whitespace-nowrap">#{tag}</span>
                                      ))}
                                      {project.tags.length > 12 && (
                                        <span className="text-2xs text-text-muted">+{project.tags.length - 12}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-xs text-text-muted">
                                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                  {fmt(project.stars)}
                                </span>
                                <a
                                  href={project.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                  GitHub
                                </a>
                              </div>
                            </div>
                            <p className="text-base text-text-muted leading-relaxed">{project.description}</p>
                          </div>
                        )}

                        <div className="space-y-16">
                          {/* Wiki Sections */}
                          {wikiLoading ? (
                            <div className="text-center py-12 text-text-muted">Loading wiki...</div>
                          ) : visibleWikiSections.length > 0 ? (
                            <>
                              <div className="flex items-center gap-4 flex-wrap">
                                {wikiGeneratedLabel && (
                                  <p className="text-2xs text-text-muted">마지막 위키 업데이트 시각: {wikiGeneratedLabel}</p>
                                )}
                                {project?.lastRelease && (
                                  <p className="text-2xs text-text-muted">최근 릴리즈: {ago(project.lastRelease)}</p>
                                )}
                              </div>

                              {visibleWikiSections.map((ws) => (
                                <section
                                  key={ws.sectionId}
                                  id={`wiki-${ws.sectionId}`}
                                  className="scroll-mt-24 pb-12 border-b border-surface-border/50 last:border-b-0 last:pb-0"
                                >
                                  <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-text-primary">{ws.heading}</h2>
                                    {ws.summary && (
                                      <div className="rounded-lg border border-surface-border/60 bg-surface-elevated/30 pl-4 pr-5 py-4 border-l-[3px] border-l-accent/50">
                                        <WikiMarkdownRenderer
                                          content={ws.summary}
                                          className="wiki-markdown--summary"
                                          headingIdPrefix={`wiki-${ws.sectionId}-summary-`}
                                        />
                                      </div>
                                    )}
                                    {ws.generatedDiagramDsl && (
                                      <MermaidCodeBlock source={ws.generatedDiagramDsl || ''} />
                                    )}
                                    {ws.deepDiveMarkdown && (
                                      <WikiMarkdownRenderer
                                        content={ws.deepDiveMarkdown}
                                        headingIdPrefix={`wiki-${ws.sectionId}-deepdive-`}
                                      />
                                    )}
                                  </div>
                                </section>
                              ))}
                            </>
                          ) : (
                            <div className="rounded-xl border border-dashed border-surface-border bg-surface-card/70 p-8 text-center text-sm text-text-muted">
                              이 프로젝트의 위키 문서는 아직 준비되지 않았습니다.
                            </div>
                          )}

                          {/* Activity Section - Latest Releases (compact) */}
                          <section id="activity" className="bg-surface-card rounded-xl border border-surface-border p-5 scroll-mt-24">
                            <h2 className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">최근 릴리스</h2>

                            {eventsLoading ? (
                              <div className="text-center py-4 text-text-muted text-xs">Loading releases...</div>
                            ) : latestReleases.length === 0 ? (
                              <div className="text-center py-4 text-text-muted text-xs">No releases found</div>
                            ) : (
                              <div className="divide-y divide-surface-border/50">
                                {latestReleases.map((ev) => (
                                  <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      {ev.sourceUrl ? (
                                        <a
                                          href={ev.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-mono text-xs font-semibold text-accent hover:text-accent-light transition-colors"
                                        >
                                          {ev.version}
                                        </a>
                                      ) : (
                                        <span className="font-mono text-xs font-semibold text-text-primary">{ev.version}</span>
                                      )}
                                      <span className="text-[11px] text-text-muted">{ev.releasedAt?.split('T')[0]}</span>
                                      <div className="flex gap-1 ml-auto">
                                        {(ev.eventTypes || []).map(t => EVENT_BADGE[t] && (
                                          <span key={t} className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-px rounded border ${EVENT_BADGE[t].cls}`}>
                                            {EVENT_BADGE[t].label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    {ev.summary && (
                                      <p className="text-xs text-text-muted leading-snug line-clamp-1">{ev.summary}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>

                          {/* Comments Section */}
                          <section id="comments" className="bg-surface-card rounded-xl border border-surface-border p-8 scroll-mt-24">
                            <div className="flex items-center gap-3 mb-8">
                              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-widest">토론</h2>
                              {comments.length > 0 && (
                                <span className="text-xs text-text-muted font-medium">{comments.length}개 댓글</span>
                              )}
                            </div>

                            {commentsLoading ? (
                              <div className="text-center py-8 text-text-muted text-sm">Loading comments...</div>
                            ) : (
                              <>
                                <div className="flex items-center gap-4 px-1 mb-8">
                                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-text-muted shrink-0 border border-surface-border font-medium">
                                    ?
                                  </div>
                                  <div className="flex-1 bg-surface-elevated/30 border border-surface-border/50 rounded-xl px-5 py-3 text-sm text-text-muted cursor-text hover:border-surface-border/80 transition-all font-light">
                                    이 프로젝트에 대해 의견을 공유하세요...
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {comments.map(thread => (
                                    <CommentItem
                                      key={thread.id}
                                      comment={thread}
                                      articleId="mock"
                                      onReply={async () => { }}
                                      onEdit={async () => { }}
                                      onDelete={async () => { }}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </section>

                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── DIRECTORY VIEW (LANDING PAGE) ── */}
        {viewType === 'directory' && (
          <main className="lg:ml-52 text-text-primary">
            {/* Aurora landing — full viewport hero */}
            <PortfolioPage
              hero={{
                titleLine1: '바이브 코더들을 위한 허브',
                titleLine2Gradient: 'Ports',
                subtitle: <>매일 쏟아지는 AI 프로젝트들, <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 500 }}>Ports</span>가 대신 확인하고 정리해드립니다.</>,
                subtitleBottom: <>가장 중요한 정보만 확인하고 <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 500 }}>챗봇</span>을 통해 궁금한 것을 물어보세요.</>,
              }}
              showAnimatedBackground={true}
            />

            {/* PORTS PROJECT LIST */}
            <div id="ports-list" className="relative z-10 max-w-[1200px] mx-auto px-6 py-24">
              {/* Search bar */}
              <div className="mb-10">
                <div className="relative max-w-2xl mx-auto">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="프로젝트 이름, 설명, 언어로 검색..."
                    className="w-full bg-surface-card border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {projectsLoading ? (
                <div className="flex items-center justify-center py-24 text-text-muted text-sm">
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2" />
                  Loading projects...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-24 text-text-muted bg-surface-card rounded-2xl border border-dashed border-surface-border">
                  {searchQuery ? `"${searchQuery}"에 대한 결과가 없습니다` : 'No projects found'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((p) => {
                    // Extract owner from fullName (e.g., "ollama/ollama" -> "ollama")
                    const owner = p.fullName.split('/')[0];
                    const avatarUrl = `https://github.com/${owner}.png?size=100`;

                    return (
                      <button
                        key={p.projectExternalId}
                        onClick={() => goProject(p.projectExternalId)}
                        className="group flex flex-col bg-surface-card/40 backdrop-blur-sm rounded-2xl border border-surface-border p-6 hover:bg-surface-hover/60 hover:border-surface-border/80 transition-all text-left shadow-lg hover:shadow-accent/5"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="w-12 h-12 rounded-xl border border-surface-border bg-surface-elevated overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            <img src={avatarUrl} alt={owner} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-text-secondary bg-surface-elevated/50 px-2.5 py-1 rounded-full border border-surface-border">
                            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            {p.stars != null ? fmt(p.stars) : '—'}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                              {p.fullName}
                            </h3>
                          </div>
                          {p.language && (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-accent/10 text-accent border border-accent/20 mb-3">{p.language}</span>
                          )}
                          {p.description && (
                            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">{p.description}</p>
                          )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-surface-border/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-accent/70 transition-colors">View Details</span>
                          <svg className="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        )}

      </div>
    </div>
  );
}
