import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WikiPage from '../WikiPage';
import type { WikiSnapshot } from '../../types/wiki';
import * as wikiService from '../../services/wiki/wikiService';

vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock('../../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock('../../components/wiki/WikiChatPanel', () => ({
  default: () => <div data-testid="chat-panel" />,
}));

vi.mock('../../services/wiki/wikiService', () => ({
  getDomainBrowseCards: vi.fn(),
  getWikiSnapshot: vi.fn(),
  getVisibleSections: vi.fn((snapshot: WikiSnapshot) =>
    snapshot.sections.filter(section => !snapshot.hiddenSections.includes(section.sectionId))
  ),
}));

function renderProjectPage() {
  render(
    <MemoryRouter initialEntries={['/wiki/web/github%3Atest%2Frepo']}>
      <Routes>
        <Route path="/wiki/:domain/:projectExternalId" element={<WikiPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderDirectoryPage() {
  render(
    <MemoryRouter initialEntries={['/wiki']}>
      <Routes>
        <Route path="/wiki" element={<WikiPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function createPublishedSnapshot(overrides: Partial<WikiSnapshot> = {}): WikiSnapshot {
  return {
    projectExternalId: 'github:test/repo',
    fullName: 'test/repo',
    generatedAt: '2026-02-16T00:00:00Z',
    hiddenSections: [],
    sections: [
      {
        sectionId: 'what',
        heading: 'What',
        anchor: 'what-github-test-repo',
        summary: 'What summary',
        deepDiveMarkdown: 'What deep',
        defaultExpanded: false,
      },
      {
        sectionId: 'activity',
        heading: 'Repository Activity',
        anchor: 'activity-github-test-repo',
        summary: 'Activity summary',
        deepDiveMarkdown: 'Activity deep',
        defaultExpanded: false,
      },
      {
        sectionId: 'releases',
        heading: 'Releases',
        anchor: 'releases-github-test-repo',
        summary: 'Release summary',
        deepDiveMarkdown: 'Release deep',
        defaultExpanded: false,
      },
    ],
    anchors: [
      { sectionId: 'what', heading: 'What', anchor: 'what-github-test-repo' },
      { sectionId: 'activity', heading: 'Repository Activity', anchor: 'activity-github-test-repo' },
      { sectionId: 'releases', heading: 'Releases', anchor: 'releases-github-test-repo' },
    ],
    currentCounters: {
      stars: 123,
      forks: 45,
      watchers: 67,
      openIssues: 8,
      updatedAt: '2026-02-16T00:00:00Z',
    },
    rightRail: {
      activityPriority: 1,
      releasesPriority: 2,
      chatPriority: 3,
      visibleSectionIds: ['what', 'activity', 'releases'],
    },
    ...overrides,
  };
}

describe('WikiPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wikiService.getDomainBrowseCards).mockResolvedValue([
      {
        domain: 'web',
        projectCount: 1,
        topProjects: [
          {
            projectExternalId: 'github:test/repo',
            fullName: 'test/repo',
            stars: 1000,
          },
        ],
      },
    ] as unknown[]);
  });

  it('renders dynamic sections and generated anchors in project view', async () => {
    vi.mocked(wikiService.getWikiSnapshot).mockResolvedValue(
      createPublishedSnapshot({
        sections: [
          {
            sectionId: 'what',
            heading: '프로젝트 개요',
            anchor: 'what-github-test-repo',
            summary: 'What summary',
            deepDiveMarkdown: 'What deep',
            defaultExpanded: false,
          },
          {
            sectionId: 'architecture',
            heading: 'Architecture',
            anchor: 'architecture-github-test-repo',
            summary: 'Architecture summary',
            deepDiveMarkdown: 'Architecture deep',
            defaultExpanded: false,
          },
          {
            sectionId: 'activity',
            heading: 'Repository Activity',
            anchor: 'activity-github-test-repo',
            summary: 'Activity summary',
            deepDiveMarkdown: 'Activity deep',
            defaultExpanded: false,
          },
          {
            sectionId: 'releases',
            heading: 'Releases',
            anchor: 'releases-github-test-repo',
            summary: 'Release summary',
            deepDiveMarkdown: 'Release deep',
            defaultExpanded: false,
          },
        ],
        anchors: [
          { sectionId: 'what', heading: '프로젝트 개요', anchor: 'what-github-test-repo' },
          { sectionId: 'architecture', heading: 'Architecture', anchor: 'architecture-github-test-repo' },
        ],
        rightRail: {
          activityPriority: 1,
          releasesPriority: 2,
          chatPriority: 3,
          visibleSectionIds: ['what', 'architecture', 'activity', 'releases'],
        },
      })
    );

    renderProjectPage();

    await screen.findByText('What summary');
    expect(wikiService.getWikiSnapshot).toHaveBeenCalledWith('github:test/repo');
    expect(screen.getByRole('button', { name: '프로젝트 개요' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Architecture' })).toBeTruthy();
    expect(screen.getByText('Architecture summary')).toBeTruthy();

    const railHeadings = Array.from(document.querySelectorAll('.bg-surface-card h3')).map(node =>
      (node as HTMLElement).textContent ?? ''
    );
    const activityIndex = railHeadings.findIndex(text => text.includes('Repository Activity'));
    const releasesIndex = railHeadings.findIndex(text => text.includes('Recent Releases'));
    expect(activityIndex).toBeGreaterThanOrEqual(0);
    expect(releasesIndex).toBeGreaterThan(activityIndex);
  });

  it('does not render hidden sections in content column', async () => {
    const visibleOnlyWhat = createPublishedSnapshot().sections.slice(0, 1);

    vi.mocked(wikiService.getVisibleSections).mockReturnValueOnce(visibleOnlyWhat);

    vi.mocked(wikiService.getWikiSnapshot).mockResolvedValue(
      createPublishedSnapshot({
        hiddenSections: ['activity', 'releases'],
        sections: [...visibleOnlyWhat],
        anchors: [{ sectionId: 'what', heading: 'What', anchor: 'what-anchor' }],
        rightRail: {
          activityPriority: 1,
          releasesPriority: 2,
          chatPriority: 3,
          visibleSectionIds: ['what'],
        },
      })
    );

    renderProjectPage();

    await screen.findByText('What summary');
    expect(screen.queryByText('Architecture summary')).toBeNull();
    expect(screen.queryByText(/repository activity/i)).toBeNull();
    expect(screen.queryByText(/recent releases/i)).toBeNull();
  });

  it('renders directory cards when no project route params', async () => {
    vi.mocked(wikiService.getWikiSnapshot).mockResolvedValue(null);

    renderDirectoryPage();

    await screen.findByText('Code Wiki');
    expect(screen.getByText('web')).toBeTruthy();
  });
});
