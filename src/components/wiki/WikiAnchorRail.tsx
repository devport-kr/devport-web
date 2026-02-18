/**
 * WikiAnchorRail - Left rail with section anchors for navigation.
 * Uses dynamic anchor payload generated from visible sections.
 */

import type { WikiAnchor } from '../../types/wiki';

interface WikiAnchorRailProps {
  anchors: WikiAnchor[];
}

export default function WikiAnchorRail({ anchors }: WikiAnchorRailProps) {
  const scrollToSection = (anchor: string) => {
    const element = document.getElementById(`section-${anchor}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="space-y-1">
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">목차</h3>
      {anchors.map(anchor => (
        <button
          key={anchor.sectionId}
          onClick={() => scrollToSection(anchor.anchor)}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          {anchor.heading}
        </button>
      ))}
    </nav>
  );
}
