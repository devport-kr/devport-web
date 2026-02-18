/**
 * WikiRightRail - Right rail with activity/release modules above chat.
 * Ordered: activity, releases, then chat at bottom.
 */

import WikiChatPanel from './WikiChatPanel';
import type { WikiPublishedSnapshot } from '../../types/wiki';

interface WikiRightRailProps {
  snapshot: WikiPublishedSnapshot;
  projectExternalId: string;
}

export default function WikiRightRail({ snapshot, projectExternalId }: WikiRightRailProps) {
  const rightRailOrdering = snapshot.rightRail ?? {
    activityPriority: 1,
    releasesPriority: 2,
    chatPriority: 3,
    visibleSectionIds: snapshot.sections.map(section => section.sectionId),
  };

  const visibleSectionIds = rightRailOrdering.visibleSectionIds;

  const hasActivity = visibleSectionIds.includes('activity') && !snapshot.hiddenSections.includes('activity');
  const hasReleases = visibleSectionIds.includes('releases') && !snapshot.hiddenSections.includes('releases');

  const activitySection = snapshot.sections.find(section => section.sectionId === 'activity');
  const releasesSection = snapshot.sections.find(section => section.sectionId === 'releases');
  const updatedAtLabel = snapshot.currentCounters?.updatedAt
    ? new Date(snapshot.currentCounters.updatedAt).toLocaleDateString('ko-KR')
    : null;

  const counterCards = [
    { label: 'Stars', value: snapshot.currentCounters?.stars ?? null },
    { label: 'Forks', value: snapshot.currentCounters?.forks ?? null },
    { label: 'Watchers', value: snapshot.currentCounters?.watchers ?? null },
    { label: 'Open Issues', value: snapshot.currentCounters?.openIssues ?? null },
  ];

  const defaultIndex: Record<'activity' | 'releases' | 'chat', number> = {
    activity: 0,
    releases: 1,
    chat: 2,
  };

  const orderedModules = [
    {
      id: 'activity' as const,
      priority: rightRailOrdering.activityPriority,
      enabled: hasActivity && Boolean(activitySection),
      content: (
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Repository Activity</span>
          </h3>
          <div className="space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">{activitySection?.summary}</p>
            {activitySection?.deepDiveMarkdown && (
              <div className="text-2xs text-text-muted/80 border-t border-surface-border/50 pt-2">
                <p className="line-clamp-2">{activitySection.deepDiveMarkdown.slice(0, 120)}...</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'releases' as const,
      priority: rightRailOrdering.releasesPriority,
      enabled: hasReleases && Boolean(releasesSection),
      content: (
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <span>🚀</span>
            <span>Recent Releases</span>
          </h3>
          <div className="space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">{releasesSection?.summary}</p>
            {releasesSection?.deepDiveMarkdown && (
              <div className="text-2xs text-text-muted/80 border-t border-surface-border/50 pt-2">
                <p className="line-clamp-3">{releasesSection.deepDiveMarkdown.slice(0, 150)}...</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'chat' as const,
      priority: rightRailOrdering.chatPriority,
      enabled: true,
      content: <WikiChatPanel projectExternalId={projectExternalId} />,
    },
  ]
    .sort((a, b) => {
      if (a.priority === b.priority) {
        return defaultIndex[a.id] - defaultIndex[b.id];
      }
      return a.priority - b.priority;
    })
    .filter(module => module.enabled);

  return (
    <div className="space-y-4">
      {/* Current Counter Module */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <span>⭐</span>
          <span>Current Repository Signals</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {counterCards.map(counter => (
            <div key={counter.label} className="rounded-lg border border-surface-border/60 bg-surface-elevated/30 px-3 py-2">
              <p className="text-2xs text-text-muted uppercase tracking-wide">{counter.label}</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">
                {typeof counter.value === 'number' ? counter.value.toLocaleString() : '-'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-2xs text-text-muted mt-3">
          Updated {updatedAtLabel ? updatedAtLabel : 'N/A'}
        </p>
      </div>

      {orderedModules.map(module => (
        <div key={module.id}>{module.content}</div>
      ))}
    </div>
  );
}
