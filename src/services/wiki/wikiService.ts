/**
 * Wiki service for fetching project wiki snapshots from API.
 * Type-safe client aligned to backend WikiSnapshotResponse contract.
 */

import type { WikiSnapshot } from '../../types/wiki';

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

    return await response.json();
  } catch (error) {
    console.error('Wiki snapshot fetch error:', error);
    throw error;
  }
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
export function getVisibleSections(snapshot: WikiSnapshot): string[] {
  const allSections: string[] = ['what', 'how', 'architecture', 'activity', 'releases', 'chat'];
  return allSections.filter(section => !snapshot.hiddenSections.includes(section));
}
