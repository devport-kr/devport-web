import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import WikiDraftEditor from '../../components/wiki-admin/WikiDraftEditor';
import WikiVersionHistoryPanel from '../../components/wiki-admin/WikiVersionHistoryPanel';
import {
  createDraft,
  getDraft,
  listDrafts,
  publishDraft,
  regenerateDraft,
  rollbackPublishedVersion,
  updateDraft,
  type WikiDraft,
  type WikiDraftUpsertPayload,
  type WikiVersionHistory,
} from '../../services/wiki/wikiAuthoringService';

interface BannerMessage {
  type: 'success' | 'error';
  text: string;
}

export default function WikiDraftsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = Number(projectId);
  const hasValidProjectId = Number.isInteger(numericProjectId) && numericProjectId > 0;

  const [drafts, setDrafts] = useState<WikiDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<WikiDraft | null>(null);

  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isLoadingDraftDetail, setIsLoadingDraftDetail] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [isLoadingVersionHistory, setIsLoadingVersionHistory] = useState(false);
  const [rollingBackVersion, setRollingBackVersion] = useState<number | null>(null);

  const [versionHistory, setVersionHistory] = useState<WikiVersionHistory | null>(null);
  const [message, setMessage] = useState<BannerMessage | null>(null);

  const selectedDraftSummary = useMemo(
    () => drafts.find(draft => draft.id === selectedDraftId) ?? null,
    [drafts, selectedDraftId],
  );

  const showMessage = useCallback((type: BannerMessage['type'], text: string) => {
    setMessage({ type, text });
  }, []);

  const refreshDrafts = useCallback(async () => {
    if (!hasValidProjectId) return;

    setIsLoadingDrafts(true);
    try {
      const fetched = await listDrafts(numericProjectId);
      setDrafts(fetched);

      if (fetched.length === 0) {
        setSelectedDraftId(null);
        setSelectedDraft(null);
        return;
      }

      if (!selectedDraftId || !fetched.some(draft => draft.id === selectedDraftId)) {
        setSelectedDraftId(fetched[0].id);
      }
    } catch {
      showMessage('error', 'Failed to load drafts.');
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [hasValidProjectId, numericProjectId, selectedDraftId, showMessage]);

  useEffect(() => {
    void refreshDrafts();
  }, [refreshDrafts]);

  const refreshSelectedDraft = useCallback(async () => {
    if (!hasValidProjectId || !selectedDraftId) {
      setSelectedDraft(null);
      return;
    }

    setIsLoadingDraftDetail(true);
    try {
      const draft = await getDraft(numericProjectId, selectedDraftId);
      setSelectedDraft(draft);
    } catch {
      setSelectedDraft(null);
      showMessage('error', 'Failed to load selected draft detail.');
    } finally {
      setIsLoadingDraftDetail(false);
    }
  }, [hasValidProjectId, numericProjectId, selectedDraftId, showMessage]);

  useEffect(() => {
    void refreshSelectedDraft();
  }, [refreshSelectedDraft]);

  const handleCreateDraft = async () => {
    if (!hasValidProjectId) return;

    setIsCreatingDraft(true);
    try {
      const created = await createDraft(numericProjectId, {
        sections: [],
        currentCounters: {},
        hiddenSections: [],
      });
      setDrafts(current => [created, ...current]);
      setSelectedDraftId(created.id);
      setSelectedDraft(created);
      showMessage('success', `Draft #${created.id} created.`);
    } catch {
      showMessage('error', 'Failed to create draft.');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleSaveDraft = async (payload: WikiDraftUpsertPayload) => {
    if (!hasValidProjectId || !selectedDraftId) return;

    setIsSavingDraft(true);
    try {
      const updated = await updateDraft(numericProjectId, selectedDraftId, payload);
      setSelectedDraft(updated);
      setDrafts(current => current.map(draft => (draft.id === updated.id ? updated : draft)));
      showMessage('success', `Draft #${updated.id} saved.`);
    } catch {
      showMessage('error', 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleRegenerateDraft = async (payload: WikiDraftUpsertPayload) => {
    if (!hasValidProjectId || !selectedDraftId) return;

    setIsRegeneratingDraft(true);
    try {
      const regenerated = await regenerateDraft(numericProjectId, selectedDraftId, payload);
      setSelectedDraft(regenerated);
      setDrafts(current => current.map(draft => (draft.id === regenerated.id ? regenerated : draft)));
      showMessage('success', `Draft #${regenerated.id} regenerated.`);
    } catch {
      showMessage('error', 'Failed to regenerate draft.');
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!hasValidProjectId || !selectedDraftId) return;

    setIsPublishingDraft(true);
    setIsLoadingVersionHistory(true);
    try {
      const history = await publishDraft(numericProjectId, selectedDraftId);
      setVersionHistory(history);
      await refreshDrafts();
      await refreshSelectedDraft();
      showMessage('success', `Draft #${selectedDraftId} published as version ${history.latestVersionNumber}.`);
    } catch {
      showMessage('error', 'Failed to publish draft.');
    } finally {
      setIsPublishingDraft(false);
      setIsLoadingVersionHistory(false);
    }
  };

  const handleRollback = async (targetVersionNumber: number) => {
    if (!hasValidProjectId) return;

    setRollingBackVersion(targetVersionNumber);
    setIsLoadingVersionHistory(true);
    try {
      const history = await rollbackPublishedVersion(numericProjectId, targetVersionNumber);
      setVersionHistory(history);
      await refreshDrafts();
      showMessage('success', `Rolled back to version ${targetVersionNumber} as latest.`);
    } catch {
      showMessage('error', `Failed to rollback to version ${targetVersionNumber}.`);
    } finally {
      setRollingBackVersion(null);
      setIsLoadingVersionHistory(false);
    }
  };

  if (!hasValidProjectId) {
    return (
      <div className="min-h-screen bg-glow">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-1">Invalid Project</h1>
          <p className="text-sm text-text-muted mb-4">A valid project ID is required to manage wiki drafts.</p>
          <Link className="text-sm text-accent hover:text-accent-light transition-colors" to="/admin">
            Back to admin
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        {/* Header strip */}
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-text-muted hover:text-text-primary transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">Wiki Drafts</h1>
            <div className="w-px h-4 bg-surface-border" />
            <span className="text-xs text-text-muted font-mono">Project #{numericProjectId}</span>
          </div>
          <button
            type="button"
            onClick={handleCreateDraft}
            disabled={isCreatingDraft}
            className="px-3 py-1.5 bg-accent hover:bg-accent-light text-white text-xs font-medium rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            {isCreatingDraft ? 'Creating...' : 'New Draft'}
          </button>
        </header>

        {/* Message banner */}
        {message && (
          <div
            className={`mb-4 px-3 py-2 rounded-lg text-xs font-medium animate-fade-in ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 3-column layout */}
        <div className="grid gap-4 xl:grid-cols-[240px_1fr_280px]">
          {/* Left: Draft list */}
          <aside className="xl:sticky xl:top-20 h-fit">
            <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
              <div className="px-3 py-2.5 border-b border-surface-border bg-surface-elevated/50 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Drafts</span>
                <span className="text-[10px] text-text-muted font-mono">{drafts.length}</span>
              </div>

              {isLoadingDrafts ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : drafts.length === 0 ? (
                <p className="p-4 text-xs text-text-muted text-center">No drafts yet</p>
              ) : (
                <div className="p-1.5 max-h-[60vh] overflow-y-auto scrollbar-minimal">
                  {drafts.map(draft => {
                    const isSelected = draft.id === selectedDraftId;
                    return (
                      <button
                        key={draft.id}
                        type="button"
                        onClick={() => setSelectedDraftId(draft.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                          isSelected
                            ? 'bg-accent/10 text-text-primary border border-accent/30'
                            : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated border border-transparent'
                        }`}
                      >
                        <div className="font-medium font-mono text-xs">#{draft.id}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{new Date(draft.updatedAt).toLocaleString()}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Center: Editor + publish */}
          <section className="min-w-0">
            {isLoadingDraftDetail ? (
              <div className="rounded-xl border border-surface-border bg-surface-card p-12 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2" />
                <span className="text-sm text-text-muted">Loading draft...</span>
              </div>
            ) : (
              <>
                <WikiDraftEditor
                  draft={selectedDraft}
                  onSave={handleSaveDraft}
                  onRegenerate={handleRegenerateDraft}
                  isSaving={isSavingDraft}
                  isRegenerating={isRegeneratingDraft}
                />

                {/* Publish strip */}
                <div className="mt-3 rounded-lg border border-surface-border bg-surface-card px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-text-primary">Publish</span>
                    <span className="text-[10px] text-text-muted ml-2">Snapshot current draft into an immutable version</span>
                  </div>
                  <button
                    type="button"
                    disabled={!selectedDraftSummary || isPublishingDraft}
                    onClick={handlePublishDraft}
                    className="px-4 py-1.5 bg-accent hover:bg-accent-light text-white text-xs font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-40 transition-all active:scale-[0.97]"
                  >
                    {isPublishingDraft ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Right: Version history */}
          <WikiVersionHistoryPanel
            history={versionHistory}
            isLoading={isLoadingVersionHistory}
            rollingBackVersion={rollingBackVersion}
            onRollback={handleRollback}
          />
        </div>
      </main>
    </div>
  );
}
