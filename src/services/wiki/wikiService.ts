/**
 * Wiki service for fetching project wiki snapshots from API.
 */

import type { WikiAnchor, WikiSection, WikiSnapshot } from '../../types/wiki';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Fetch wiki snapshot by project external ID.
 * Only returns data-ready snapshots with visible sections.
 *
 * @param projectExternalId GitHub project external ID (e.g., "github:12345")
 * @returns Wiki snapshot if found and data-ready, null otherwise
 */
export async function getWikiSnapshot(projectExternalId: string): Promise<WikiSnapshot | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wiki/projects/${encodeURIComponent(projectExternalId)}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki snapshot: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    return normalizeWikiSnapshot(payload, projectExternalId);
  } catch (error) {
    console.error('Wiki snapshot fetch error:', error);
    throw error;
  }
}

function normalizeWikiSnapshot(payload: unknown, fallbackProjectExternalId: string): WikiSnapshot {
  const source = isRecord(payload) ? payload : {};
  const sections = normalizeSections(source.sections);
  const hiddenSections = normalizeHiddenSections(source.hiddenSections);
  const visibleSections = sections.filter(section => !hiddenSections.includes(section.sectionId));
  const anchors = normalizeAnchors(source.anchors, visibleSections);

  return {
    projectExternalId:
      typeof source.projectExternalId === 'string' && source.projectExternalId.length > 0
        ? source.projectExternalId
        : fallbackProjectExternalId,
    fullName: typeof source.fullName === 'string' ? source.fullName : undefined,
    generatedAt: typeof source.generatedAt === 'string' ? source.generatedAt : new Date().toISOString(),
    sections,
    anchors,
    hiddenSections,
    currentCounters: isRecord(source.currentCounters) ? (source.currentCounters as WikiSnapshot['currentCounters']) : null,
    rightRail: isRecord(source.rightRail)
      ? {
          activityPriority: toNumber(source.rightRail.activityPriority, 1),
          releasesPriority: toNumber(source.rightRail.releasesPriority, 2),
          chatPriority: toNumber(source.rightRail.chatPriority, 3),
          visibleSectionIds: normalizeStringArray(source.rightRail.visibleSectionIds),
        }
      : null,
    readinessMetadata: isRecord(source.readinessMetadata) ? source.readinessMetadata : undefined,
  };
}

function normalizeSections(input: unknown): WikiSection[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const sections: WikiSection[] = [];

  for (const item of input) {
    if (!isRecord(item)) {
      continue;
    }

    const sectionId = typeof item.sectionId === 'string' ? item.sectionId : '';
    const heading = typeof item.heading === 'string' ? item.heading : sectionId;
    const anchor = typeof item.anchor === 'string' && item.anchor.length > 0 ? item.anchor : sectionId;
    const summary = typeof item.summary === 'string' ? item.summary : '';
    const deepDiveMarkdown = typeof item.deepDiveMarkdown === 'string' ? item.deepDiveMarkdown : '';

    if (!sectionId || !heading) {
      continue;
    }

    sections.push({
      sectionId,
      heading,
      anchor,
      summary,
      deepDiveMarkdown,
      defaultExpanded: Boolean(item.defaultExpanded),
      generatedDiagramDsl: typeof item.generatedDiagramDsl === 'string' ? item.generatedDiagramDsl : null,
      diagramMetadata: isRecord(item.diagramMetadata) ? item.diagramMetadata : null,
      metadata: isRecord(item.metadata) ? item.metadata : null,
    });
  }

  return sections;
}

function normalizeAnchors(input: unknown, visibleSections: WikiSection[]): WikiAnchor[] {
  if (!Array.isArray(input)) {
    return visibleSections.map(section => ({
      sectionId: section.sectionId,
      heading: section.heading,
      anchor: section.anchor,
    }));
  }

  const normalized = input
    .map(item => {
      if (!isRecord(item)) {
        return null;
      }

      const sectionId = typeof item.sectionId === 'string' ? item.sectionId : '';
      if (!sectionId || !visibleSections.some(section => section.sectionId === sectionId)) {
        return null;
      }

      const linkedSection = visibleSections.find(section => section.sectionId === sectionId);
      return {
        sectionId,
        heading: typeof item.heading === 'string' ? item.heading : linkedSection?.heading ?? sectionId,
        anchor:
          typeof item.anchor === 'string' && item.anchor.length > 0
            ? item.anchor
            : linkedSection?.anchor ?? sectionId,
      } satisfies WikiAnchor;
    })
    .filter((anchor): anchor is WikiAnchor => anchor !== null);

  return normalized.length > 0
    ? normalized
    : visibleSections.map(section => ({
        sectionId: section.sectionId,
        heading: section.heading,
        anchor: section.anchor,
      }));
}

function normalizeHiddenSections(input: unknown): string[] {
  return normalizeStringArray(input);
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((item): item is string => typeof item === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Known wiki domains from design.
 * Frontend iterates these to build complete domain browse view.
 */
const KNOWN_DOMAINS = ['web', 'mobile', 'data', 'devtools', 'ml'];

/**
 * Get domain browse cards for wiki discovery.
 * Returns list of domains with top projects per domain.
 * Fetches each domain individually and aggregates results.
 *
 * @returns Domain browse cards with project summaries
 */
export async function getDomainBrowseCards(): Promise<unknown[]> {
  try {
    const responses = await Promise.all(
      KNOWN_DOMAINS.map(domain => 
        fetch(`${API_BASE_URL}/api/wiki/domains/${encodeURIComponent(domain)}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    );

    // Filter out failed requests and return valid domain responses
    return responses.filter(response => response !== null);
  } catch (error) {
    console.error('Domain browse cards fetch error:', error);
    throw error;
  }
}

/**
 * Get wiki project information by external ID.
 * Returns project metadata and domain categorization.
 *
 * @param projectExternalId GitHub project external ID
 * @returns Project information
 */
export async function getWikiProject(projectExternalId: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wiki/projects/${encodeURIComponent(projectExternalId)}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki project: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Wiki project fetch error:', error);
    throw error;
  }
}

/**
 * Check if a section should be rendered based on hidden sections list.
 *
 * @param sectionName Section name to check
 * @param hiddenSections List of hidden section names from snapshot
 * @returns True if section should be visible
 */
export function isSectionVisible(sectionName: string, hiddenSections: string[]): boolean {
  return !hiddenSections.includes(sectionName);
}

/**
 * Get visible sections from a wiki snapshot.
 *
 * @param snapshot Wiki snapshot with hidden sections metadata
 * @returns Array of visible section names
 */
export function getVisibleSections(snapshot: WikiSnapshot): WikiSection[] {
  return snapshot.sections.filter(section => !snapshot.hiddenSections.includes(section.sectionId));
}
