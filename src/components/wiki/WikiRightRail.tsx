/**
 * WikiRightRail - Right rail with activity/release modules above chat.
 * Ordered: activity, releases, then chat at bottom.
 */

import WikiChatPanel from './WikiChatPanel';
import type { WikiSnapshot } from '../../types/wiki';

interface WikiRightRailProps {
  snapshot: WikiSnapshot;
  projectExternalId: string;
}

export default function WikiRightRail({ snapshot, projectExternalId }: WikiRightRailProps) {
  // Check if activity and releases sections are visible
  const hasActivity = !snapshot.hiddenSections?.includes('activity');
  const hasReleases = !snapshot.hiddenSections?.includes('releases');

  return (
    <div className="space-y-4">
      {/* Activity Module */}
      {hasActivity && snapshot.activity && (
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Repository Activity</span>
          </h3>
          <div className="space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">{snapshot.activity.summary}</p>
            {snapshot.activity.deepDiveMarkdown && (
              <div className="text-2xs text-text-muted/80 border-t border-surface-border/50 pt-2">
                <p className="line-clamp-2">{snapshot.activity.deepDiveMarkdown.slice(0, 120)}...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Release Timeline Module */}
      {hasReleases && snapshot.releases && (
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <span>🚀</span>
            <span>Recent Releases</span>
          </h3>
          <div className="space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">{snapshot.releases.summary}</p>
            {snapshot.releases.deepDiveMarkdown && (
              <div className="text-2xs text-text-muted/80 border-t border-surface-border/50 pt-2">
                <p className="line-clamp-3">{snapshot.releases.deepDiveMarkdown.slice(0, 150)}...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Panel (always at bottom) */}
      <WikiChatPanel projectExternalId={projectExternalId} />
    </div>
  );
}
