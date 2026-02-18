import type { WikiVersionHistory } from '../../services/wiki/wikiAuthoringService';

interface WikiVersionHistoryPanelProps {
  history: WikiVersionHistory | null;
  isLoading: boolean;
  rollingBackVersion: number | null;
  onRollback: (targetVersionNumber: number) => Promise<void>;
}

export default function WikiVersionHistoryPanel({
  history,
  isLoading,
  rollingBackVersion,
  onRollback,
}: WikiVersionHistoryPanelProps) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Published Version History</h3>
        <p className="text-xs text-text-muted">Choose a published version to rollback. Rollback creates a new latest version.</p>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading version history...</p>}

      {!isLoading && (!history || history.versions.length === 0) && (
        <p className="text-sm text-text-muted">No published versions yet. Publish a draft to initialize version history.</p>
      )}

      {!isLoading && history && history.versions.length > 0 && (
        <ul className="space-y-2">
          {history.versions.map(version => {
            const isLatest = version.versionNumber === history.latestVersionNumber;
            const isRollingBack = rollingBackVersion === version.versionNumber;

            return (
              <li
                key={version.versionId}
                className="flex items-center justify-between gap-3 rounded-lg border border-surface-border/80 bg-surface-elevated px-3 py-2"
              >
                <div>
                  <p className="text-sm text-text-primary">
                    Version {version.versionNumber}
                    {isLatest ? ' (latest)' : ''}
                  </p>
                  <p className="text-xs text-text-muted">Published at {new Date(version.publishedAt).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  disabled={isLatest || isRollingBack}
                  onClick={() => onRollback(version.versionNumber)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRollingBack ? 'Rolling back...' : `Rollback to v${version.versionNumber}`}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
