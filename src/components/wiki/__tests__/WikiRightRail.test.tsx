import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import WikiRightRail from '../WikiRightRail';
import type { WikiSnapshot } from '../../../types/wiki';

function createSnapshot(hiddenSections: string[] = []): WikiSnapshot {
  return {
    projectExternalId: 'github:test/repo',
    fullName: 'test/repo',
    generatedAt: '2026-02-16T00:00:00Z',
    hiddenSections,
    sections: [
      {
        sectionId: 'activity',
        heading: 'Activity',
        anchor: 'activity-anchor',
        summary: 'Activity summary',
        deepDiveMarkdown: 'Activity detail',
        defaultExpanded: false,
      },
      {
        sectionId: 'releases',
        heading: 'Releases',
        anchor: 'release-anchor',
        summary: 'Release summary',
        deepDiveMarkdown: 'Release detail',
        defaultExpanded: false,
      },
    ],
    anchors: [],
    currentCounters: {
      stars: 100,
      forks: 50,
      watchers: 25,
      openIssues: 10,
      updatedAt: '2026-02-16T00:00:00Z',
    },
    rightRail: {
      activityPriority: 1,
      releasesPriority: 2,
      chatPriority: 3,
      visibleSectionIds: ['activity', 'releases'],
    },
  };
}

describe('WikiRightRail', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders current counters and keeps activity/releases ordering', () => {
    const { container } = render(
      <WikiRightRail snapshot={createSnapshot()} projectExternalId="github:test/repo" />
    );

    expect(screen.getByText('Current Repository Signals')).toBeTruthy();

    const moduleHeadings = Array.from(container.querySelectorAll('.bg-surface-card h3')).map(node =>
      (node as HTMLElement).textContent ?? ''
    );
    const activityIndex = moduleHeadings.findIndex(text => text.includes('Repository Activity'));
    const releasesIndex = moduleHeadings.findIndex(text => text.includes('Recent Releases'));

    expect(activityIndex).toBeGreaterThanOrEqual(0);
    expect(releasesIndex).toBeGreaterThan(activityIndex);
  });

  it('hides activity and releases modules by hiddenSections while keeping counters', () => {
    render(
      <WikiRightRail snapshot={createSnapshot(['activity', 'releases'])} projectExternalId="github:test/repo" />
    );

    expect(screen.getByText('Current Repository Signals')).toBeTruthy();
    expect(screen.queryByText(/repository activity/i)).toBeNull();
    expect(screen.queryByText(/recent releases/i)).toBeNull();
  });
});
