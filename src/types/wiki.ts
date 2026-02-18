/**
 * Wiki types aligned to backend WikiProjectPageResponse contract.
 */

export interface WikiDiagramMetadata {
  diagramType?: string;
  altText?: string;
  renderHints?: string;
}

export interface WikiSection {
  sectionId: string;
  heading: string;
  anchor: string;
  summary: string;
  deepDiveMarkdown: string;
  defaultExpanded: boolean;
  generatedDiagramDsl?: string | null;
  diagramMetadata?: WikiDiagramMetadata | null;
  metadata?: Record<string, unknown> | null;
}

export interface WikiAnchor {
  sectionId: string;
  heading: string;
  anchor: string;
}

export interface WikiCurrentCounters {
  stars?: number | null;
  forks?: number | null;
  watchers?: number | null;
  openIssues?: number | null;
  updatedAt?: string | null;
}

export interface WikiRightRailOrdering {
  activityPriority: number;
  releasesPriority: number;
  chatPriority: number;
  visibleSectionIds: string[];
}

export interface WikiPublishedSnapshot {
  projectExternalId: string;
  fullName?: string;
  generatedAt: string;
  sections: WikiSection[];
  anchors: WikiAnchor[];
  hiddenSections: string[];
  currentCounters?: WikiCurrentCounters | null;
  rightRail?: WikiRightRailOrdering | null;
  readinessMetadata?: Record<string, unknown>;
}

export interface WikiSnapshot extends WikiPublishedSnapshot {
  // Legacy fields kept optional for existing pages outside /wiki route.
  what?: Partial<WikiSection>;
  how?: Partial<WikiSection>;
  architecture?: Partial<WikiSection>;
  activity?: Partial<WikiSection>;
  releases?: Partial<WikiSection>;
  chat?: Partial<WikiSection>;
}
