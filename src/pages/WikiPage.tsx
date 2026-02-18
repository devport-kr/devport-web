import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { WikiAnchor, WikiPublishedSnapshot, WikiSnapshot } from '../types/wiki';
import { getDomainBrowseCards, getWikiSnapshot, getVisibleSections } from '../services/wiki/wikiService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import WikiAnchorRail from '../components/wiki/WikiAnchorRail';
import WikiContentColumn from '../components/wiki/WikiContentColumn';
import WikiRightRail from '../components/wiki/WikiRightRail';

function toPublishedWikiSnapshot(snapshot: WikiSnapshot | null): WikiPublishedSnapshot | null {
  if (!snapshot) {
    return null;
  }

  return {
    projectExternalId: snapshot.projectExternalId,
    fullName: snapshot.fullName,
    generatedAt: snapshot.generatedAt,
    sections: snapshot.sections,
    anchors: snapshot.anchors,
    hiddenSections: snapshot.hiddenSections,
    currentCounters: snapshot.currentCounters,
    rightRail: snapshot.rightRail,
    readinessMetadata: snapshot.readinessMetadata,
  };
}

// Domain browse card type (minimal structure)
interface DomainCard {
  domain: string;
  projectCount: number;
  topProjects: Array<{
    projectExternalId: string;
    fullName: string;
    stars: number;
    description?: string;
  }>;
}

export default function WikiPage() {
  const { domain, projectExternalId } = useParams<{ domain?: string; projectExternalId?: string }>();
  const navigate = useNavigate();

  // Domain browse state
  const [domains, setDomains] = useState<DomainCard[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);

  // Wiki snapshot state
  const [snapshot, setSnapshot] = useState<WikiPublishedSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Determine current view
  const viewType = projectExternalId ? 'project' : domain ? 'domain' : 'directory';

  // Load domain browse cards (always load for directory view)
  useEffect(() => {
    setDomainsLoading(true);
    getDomainBrowseCards()
      .then(data => setDomains(data as DomainCard[]))
      .catch(err => {
        console.error('Failed to load domains:', err);
        setDomains([]);
      })
      .finally(() => setDomainsLoading(false));
  }, []);

  // Load wiki snapshot when projectExternalId changes
  useEffect(() => {
    if (projectExternalId) {
      setSnapshotLoading(true);
      getWikiSnapshot(projectExternalId)
        .then(response => setSnapshot(toPublishedWikiSnapshot(response)))
        .catch(err => {
          console.error('Failed to load wiki snapshot:', err);
          setSnapshot(null);
        })
        .finally(() => setSnapshotLoading(false));
    } else {
      setSnapshot(null);
    }
  }, [projectExternalId]);

  // Find current domain data
  const currentDomain = domains.find(d => d.domain === domain);

  // Navigation helpers
  const goDomain = (domainName: string) => navigate(`/wiki/${domainName}`);
  const goProject = (projExternalId: string, domainName: string) => navigate(`/wiki/${domainName}/${projExternalId}`);
  const goDirectory = () => navigate('/wiki');

  // Get visible dynamic sections and anchors for wiki rails
  const visibleSections = snapshot ? getVisibleSections(snapshot) : [];
  const visibleAnchors: WikiAnchor[] = snapshot
    ? (() => {
        const anchors = snapshot.anchors.filter(anchor =>
          visibleSections.some(section => section.sectionId === anchor.sectionId)
        );
        return anchors.length > 0
          ? anchors
          : visibleSections.map(section => ({
              sectionId: section.sectionId,
              heading: section.heading,
              anchor: section.anchor,
            }));
      })()
    : [];

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* ─── PROJECT WIKI VIEW ── */}
        {viewType === 'project' && (
          <div className="lg:ml-52 min-h-[calc(100vh-4rem)]">
            {snapshotLoading || !snapshot ? (
              <div className="flex items-center justify-center py-24 text-text-muted">
                {snapshotLoading ? 'Loading wiki...' : 'Wiki not found'}
              </div>
            ) : (
              <>
                {/* Left Anchor Rail */}
                <aside className="fixed left-52 top-16 w-48 h-[calc(100vh-4rem)] pt-8 pb-8 px-4 border-r border-surface-border/50 overflow-y-auto hidden xl:block bg-surface z-20 scrollbar-hide">
                  <WikiAnchorRail anchors={visibleAnchors} />
                </aside>

                {/* Right Activity/Releases/Chat Rail */}
                <aside className="fixed right-0 top-16 w-[28%] min-w-[340px] max-w-[420px] h-[calc(100vh-4rem)] pt-8 pb-8 px-6 border-l border-surface-border/50 overflow-y-auto hidden xl:block bg-surface z-20 scrollbar-hide">
                  <WikiRightRail snapshot={snapshot} projectExternalId={projectExternalId!} />
                </aside>

                {/* Center Content Column */}
                <div className="xl:ml-48 xl:mr-[28%] max-w-4xl mx-auto px-6 py-8">
                  <WikiContentColumn snapshot={snapshot} sections={visibleSections} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── DOMAIN & DIRECTORY VIEWS ── */}
        {viewType !== 'project' && (
          <main className="lg:ml-52 max-w-[1100px] mx-auto px-6 py-8">
            {/* ─── DIRECTORY VIEW ── */}
            {viewType === 'directory' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-text-primary tracking-tight mb-1">Code Wiki</h1>
                  <p className="text-sm text-text-muted">Browse open-source projects by domain</p>
                </div>

                {domainsLoading ? (
                  <div className="text-center py-12 text-text-muted">Loading domains...</div>
                ) : (
                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                    {domains.map(d => (
                      <button
                        key={d.domain}
                        onClick={() => goDomain(d.domain)}
                        className="w-full flex items-center gap-5 px-5 py-4 hover:bg-surface-hover/50 transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-text-primary group-hover:text-accent-light transition-colors">
                              {d.domain}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">{d.projectCount} projects</p>
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

            {/* ─── DOMAIN VIEW ── */}
            {viewType === 'domain' && currentDomain && (
              <div>
                <div className="mb-6">
                  <button
                    onClick={goDirectory}
                    className="text-sm text-text-muted hover:text-text-primary mb-2 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    All domains
                  </button>
                  <h1 className="text-2xl font-semibold text-text-primary tracking-tight">{currentDomain.domain}</h1>
                  <p className="text-sm text-text-muted">{currentDomain.projectCount} projects</p>
                </div>

                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                  {currentDomain.topProjects.map(proj => (
                    <button
                      key={proj.projectExternalId}
                      onClick={() => goProject(proj.projectExternalId, currentDomain.domain)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-hover/50 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-text-primary group-hover:text-accent-light transition-colors truncate">
                            {proj.fullName}
                          </span>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-text-muted truncate">{proj.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-xs text-text-secondary">{proj.stars.toLocaleString()}</span>
                      </div>

                      <svg className="w-4 h-4 text-text-muted/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
