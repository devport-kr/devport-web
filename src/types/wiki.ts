/**
 * Wiki snapshot types aligned to API WikiSnapshotResponse.
 * Provides type-safe access to Core-6 sections with progressive disclosure.
 */

/**
 * Individual wiki section with summary + deep dive content.
 */
export interface WikiSection {
  /** Short summary paragraph (1-3 sentences) */
  summary: string;
  /** Full technical explanation in markdown format */
  deepDiveMarkdown: string;
  /** Whether this section should be expanded by default */
  defaultExpanded: boolean;
  /** Optional Mermaid DSL for generated architecture/flow diagrams */
  generatedDiagramDsl?: string | null;
}

/**
 * Complete wiki snapshot with Core-6 sections and readiness metadata.
 */
export interface WikiSnapshot {
  /** Project external ID (e.g., "github:12345") */
  projectExternalId: string;
  /** Snapshot generation timestamp */
  generatedAt: string;

  // Core-6 sections
  /** What this project is - purpose, domain, users */
  what: WikiSection;
  /** How it works - key concepts, workflows, usage */
  how: WikiSection;
  /** Architecture and codebase - structure, components, design */
  architecture: WikiSection;
  /** Repository activity - 12-month event history */
  activity: WikiSection;
  /** Releases and tags - timeline with narrative */
  releases: WikiSection;
  /** Chat module payload - repo context for Q&A */
  chat: WikiSection;

  // Readiness and hiding controls
  /** Whether this project meets minimum data quality thresholds */
  isDataReady: boolean;
  /** Section names to hide due to incomplete data */
  hiddenSections: string[];
  /** Detailed readiness scoring and gate results */
  readinessMetadata: Record<string, unknown>;
}

/**
 * Section types for type-safe section access.
 */
export type SectionType = 'what' | 'how' | 'architecture' | 'activity' | 'releases' | 'chat';
