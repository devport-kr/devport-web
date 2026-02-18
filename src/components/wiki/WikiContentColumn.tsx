/**
 * WikiContentColumn - Center column rendering progressive dynamic wiki sections.
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { WikiSection, WikiSnapshot } from '../../types/wiki';

interface WikiContentColumnProps {
  snapshot: WikiSnapshot;
  sections: WikiSection[];
}

const SECTION_ICONS: Record<string, string> = {
  what: '📌',
  how: '⚙️',
  architecture: '🏗️',
  activity: '📊',
  releases: '🚀',
  chat: '💬',
};

export default function WikiContentColumn({ snapshot, sections }: WikiContentColumnProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(section => section.defaultExpanded).map(section => section.sectionId))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {sections.map(section => {
        const icon = SECTION_ICONS[section.sectionId] || '📄';
        const isExpanded = expandedSections.has(section.sectionId);
        const hasDiagram = !!section.generatedDiagramDsl;

        return (
          <section
            key={section.sectionId}
            id={`section-${section.anchor}`}
            className="bg-surface-card rounded-xl border border-surface-border overflow-hidden"
          >
            {/* Section Header */}
            <div className="px-5 py-3 border-b border-surface-border bg-surface-elevated/30">
              <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <span>{icon}</span>
                <span>{section.heading}</span>
              </h2>
            </div>

            {/* Section Content */}
            <div className="px-5 py-5 space-y-4">
              {/* Summary */}
              <p className="text-sm text-text-primary leading-relaxed">{section.summary}</p>

              {/* Architecture Diagram (if present) */}
              {hasDiagram && (
                <div className="bg-surface-elevated/50 rounded-lg p-4 border border-surface-border">
                  <pre className="text-xs text-text-muted overflow-x-auto font-mono">
                    {section.generatedDiagramDsl}
                  </pre>
                  <p className="text-2xs text-text-muted mt-2">
                    Generated architecture diagram (Mermaid DSL)
                  </p>
                </div>
              )}

              {/* Deep Dive (expandable) */}
              {section.deepDiveMarkdown && (
                <div>
                  <button
                    onClick={() => toggleSection(section.sectionId)}
                    className="flex items-center gap-2 text-xs text-accent hover:text-accent-light transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{isExpanded ? '기술 세부사항 접기' : '기술 세부사항 펼치기'}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{section.deepDiveMarkdown}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Generation Metadata */}
      <div className="text-center py-4">
        <p className="text-2xs text-text-muted">
          Generated: {new Date(snapshot.generatedAt).toLocaleString('ko-KR')}
        </p>
      </div>
    </div>
  );
}
