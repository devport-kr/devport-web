import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WikiDraft, WikiDraftUpsertPayload } from '../../services/wiki/wikiAuthoringService';

interface WikiDraftEditorProps {
  draft: WikiDraft | null;
  onSave: (payload: WikiDraftUpsertPayload) => Promise<void>;
  onRegenerate: (payload: WikiDraftUpsertPayload) => Promise<void>;
  isSaving: boolean;
  isRegenerating: boolean;
}

function safePrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

function parseJson<T>(value: string, fallback: T): T {
  if (!value.trim()) {
    return fallback;
  }
  return JSON.parse(value) as T;
}

type EditorTab = 'sections' | 'counters' | 'hidden';

function LineNumbers({ text }: { text: string }) {
  const lines = text.split('\n').length;
  return (
    <div
      className="select-none text-right pr-3 pt-[9px] text-text-muted/40 font-mono text-[11px] leading-[1.625] shrink-0"
      aria-hidden
    >
      {Array.from({ length: lines }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

export default function WikiDraftEditor({
  draft,
  onSave,
  onRegenerate,
  isSaving,
  isRegenerating,
}: WikiDraftEditorProps) {
  const [sectionsJson, setSectionsJson] = useState('[]');
  const [currentCountersJson, setCurrentCountersJson] = useState('{}');
  const [hiddenSectionsInput, setHiddenSectionsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('sections');
  const sectionsRef = useRef<HTMLTextAreaElement>(null);
  const countersRef = useRef<HTMLTextAreaElement>(null);
  const sectionsLineRef = useRef<HTMLDivElement>(null);
  const countersLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draft) {
      setSectionsJson('[]');
      setCurrentCountersJson('{}');
      setHiddenSectionsInput('');
      setError(null);
      return;
    }

    setSectionsJson(safePrettyJson(draft.sections));
    setCurrentCountersJson(safePrettyJson(draft.currentCounters));
    setHiddenSectionsInput((draft.hiddenSections || []).join(', '));
    setError(null);
  }, [draft]);

  const updatedAtLabel = useMemo(() => {
    if (!draft?.updatedAt) return null;
    return new Date(draft.updatedAt).toLocaleString();
  }, [draft?.updatedAt]);

  const sectionLineCount = sectionsJson.split('\n').length;
  const counterLineCount = currentCountersJson.split('\n').length;

  const buildPayload = (): WikiDraftUpsertPayload | null => {
    try {
      const sections = parseJson<Array<Record<string, unknown>>>(sectionsJson, []);
      const currentCounters = parseJson<Record<string, unknown>>(currentCountersJson, {});

      if (!Array.isArray(sections)) {
        throw new Error('sections must be a JSON array');
      }

      if (currentCounters === null || Array.isArray(currentCounters) || typeof currentCounters !== 'object') {
        throw new Error('currentCounters must be a JSON object');
      }

      const hiddenSections = hiddenSectionsInput
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

      setError(null);
      return { sections, currentCounters, hiddenSections };
    } catch (jsonError) {
      setError(jsonError instanceof Error ? jsonError.message : 'Invalid JSON payload');
      return null;
    }
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    await onSave(payload);
  };

  const handleRegenerate = async () => {
    const payload = buildPayload();
    if (!payload) return;
    await onRegenerate(payload);
  };

  // Sync scroll between textarea and line numbers
  const syncScroll = useCallback((textarea: HTMLTextAreaElement | null, lineDiv: HTMLDivElement | null) => {
    if (textarea && lineDiv) {
      lineDiv.scrollTop = textarea.scrollTop;
    }
  }, []);

  // Handle Tab key in textareas for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);

      if (activeTab === 'sections') {
        setSectionsJson(newValue);
      } else if (activeTab === 'counters') {
        setCurrentCountersJson(newValue);
      }

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface-card p-12 text-center">
        <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">Select a draft to begin editing</p>
      </div>
    );
  }

  const tabs: Array<{ id: EditorTab; label: string; count: number | null }> = [
    { id: 'sections', label: 'Sections', count: sectionLineCount },
    { id: 'counters', label: 'Counters', count: counterLineCount },
    { id: 'hidden', label: 'Hidden IDs', count: hiddenSectionsInput.split(',').filter(s => s.trim()).length || null },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-surface-border bg-surface-card overflow-hidden" style={{ minHeight: '520px' }}>
      {/* Editor header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-surface-elevated/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary font-mono">Draft #{draft.id}</span>
          <div className="w-px h-3.5 bg-surface-border" />
          <span className="text-[10px] text-text-muted">last-write-wins</span>
        </div>
        <div className="flex items-center gap-2">
          {updatedAtLabel && (
            <span className="text-[10px] text-text-muted font-mono">{updatedAtLabel}</span>
          )}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-3 py-1.5 border border-surface-border text-xs font-medium text-text-secondary rounded-md hover:border-accent/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-accent hover:bg-accent-light text-white text-xs font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-50 transition-all active:scale-[0.97]"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-4 border-b border-surface-border bg-surface-elevated/30 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="ml-1.5 text-[10px] text-text-muted/60 font-mono">{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-accent rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-red-500/8 border-b border-red-500/20 shrink-0">
          <p className="text-xs text-red-400 font-mono">{error}</p>
        </div>
      )}

      {/* Editor panels */}
      <div className="flex-1 min-h-0">
        {/* Sections JSON editor */}
        {activeTab === 'sections' && (
          <div className="flex h-full">
            <div
              ref={sectionsLineRef}
              className="w-12 bg-surface-elevated/40 border-r border-surface-border/50 overflow-hidden shrink-0"
            >
              <LineNumbers text={sectionsJson} />
            </div>
            <textarea
              ref={sectionsRef}
              value={sectionsJson}
              onChange={e => setSectionsJson(e.target.value)}
              onScroll={() => syncScroll(sectionsRef.current, sectionsLineRef.current)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full bg-transparent px-4 py-2 font-mono text-[12px] leading-[1.625] text-text-primary resize-none focus:outline-none placeholder:text-text-muted/30 scrollbar-minimal"
              style={{ minHeight: '400px' }}
              spellCheck={false}
              placeholder='[\n  {\n    "sectionId": "what",\n    "heading": "What is this?",\n    ...\n  }\n]'
            />
          </div>
        )}

        {/* Counters JSON editor */}
        {activeTab === 'counters' && (
          <div className="flex h-full">
            <div
              ref={countersLineRef}
              className="w-12 bg-surface-elevated/40 border-r border-surface-border/50 overflow-hidden shrink-0"
            >
              <LineNumbers text={currentCountersJson} />
            </div>
            <textarea
              ref={countersRef}
              value={currentCountersJson}
              onChange={e => setCurrentCountersJson(e.target.value)}
              onScroll={() => syncScroll(countersRef.current, countersLineRef.current)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full bg-transparent px-4 py-2 font-mono text-[12px] leading-[1.625] text-text-primary resize-none focus:outline-none placeholder:text-text-muted/30 scrollbar-minimal"
              style={{ minHeight: '240px' }}
              spellCheck={false}
              placeholder='{\n  "stars": 1200,\n  "forks": 340,\n  ...\n}'
            />
          </div>
        )}

        {/* Hidden Sections */}
        {activeTab === 'hidden' && (
          <div className="p-4">
            <label className="block text-[10px] font-semibold text-text-muted mb-2 uppercase tracking-widest">
              Hidden Section IDs
            </label>
            <input
              value={hiddenSectionsInput}
              onChange={event => setHiddenSectionsInput(event.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-text-primary font-mono focus:border-accent/60 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all placeholder:text-text-muted/40"
              placeholder="activity, releases"
            />
            <p className="mt-2 text-[10px] text-text-muted">
              Comma-separated section IDs to exclude from the published snapshot.
            </p>
            {hiddenSectionsInput.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {hiddenSectionsInput.split(',').map(s => s.trim()).filter(Boolean).map((id, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-text-muted border border-surface-border font-mono">{id}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
