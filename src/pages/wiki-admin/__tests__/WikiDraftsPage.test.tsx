import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WikiDraftsPage from '../WikiDraftsPage';
import * as wikiAuthoringService from '../../../services/wiki/wikiAuthoringService';

vi.mock('../../../components/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock('../../../services/wiki/wikiAuthoringService', () => ({
  listDrafts: vi.fn(),
  getDraft: vi.fn(),
  createDraft: vi.fn(),
  updateDraft: vi.fn(),
  regenerateDraft: vi.fn(),
  publishDraft: vi.fn(),
  rollbackPublishedVersion: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/admin/wiki/projects/1/drafts']}>
      <Routes>
        <Route path="/admin/wiki/projects/:projectId/drafts" element={<WikiDraftsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WikiDraftsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(wikiAuthoringService.listDrafts).mockResolvedValue([
      {
        id: 101,
        projectId: 1,
        sections: [],
        currentCounters: {},
        hiddenSections: [],
        sourcePublishedVersionId: null,
        createdAt: '2026-02-16T00:00:00Z',
        updatedAt: '2026-02-16T01:00:00Z',
      },
      {
        id: 102,
        projectId: 1,
        sections: [],
        currentCounters: {},
        hiddenSections: [],
        sourcePublishedVersionId: null,
        createdAt: '2026-02-16T00:30:00Z',
        updatedAt: '2026-02-16T01:30:00Z',
      },
    ]);

    vi.mocked(wikiAuthoringService.getDraft).mockResolvedValue({
      id: 101,
      projectId: 1,
      sections: [
        {
          sectionId: 'what',
          heading: 'What',
          summary: 'Summary',
          deepDiveMarkdown: 'Deep dive',
        },
      ],
      currentCounters: {
        stars: 100,
      },
      hiddenSections: [],
      sourcePublishedVersionId: null,
      createdAt: '2026-02-16T00:00:00Z',
      updatedAt: '2026-02-16T02:00:00Z',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders multiple drafts with last-write-wins messaging and no citation gate UI', async () => {
    renderPage();

    await screen.findByText('Draft #101');
    expect(screen.getByText('Draft #102')).toBeTruthy();
    expect(await screen.findByText(/Latest save wins/i)).toBeTruthy();
    expect(screen.queryByText(/citation/i)).toBeNull();
    expect(screen.queryByText(/provenance/i)).toBeNull();
  });

  it('publishes selected draft and allows rollback from version history panel', async () => {
    vi.mocked(wikiAuthoringService.publishDraft).mockResolvedValue({
      projectId: 1,
      latestVersionNumber: 2,
      versions: [
        {
          versionId: 22,
          versionNumber: 2,
          publishedFromDraftId: 101,
          rolledBackFromVersionId: null,
          publishedAt: '2026-02-16T03:00:00Z',
        },
        {
          versionId: 21,
          versionNumber: 1,
          publishedFromDraftId: 100,
          rolledBackFromVersionId: null,
          publishedAt: '2026-02-16T02:00:00Z',
        },
      ],
    });

    vi.mocked(wikiAuthoringService.rollbackPublishedVersion).mockResolvedValue({
      projectId: 1,
      latestVersionNumber: 3,
      versions: [
        {
          versionId: 23,
          versionNumber: 3,
          publishedFromDraftId: null,
          rolledBackFromVersionId: 21,
          publishedAt: '2026-02-16T04:00:00Z',
        },
        {
          versionId: 22,
          versionNumber: 2,
          publishedFromDraftId: 101,
          rolledBackFromVersionId: null,
          publishedAt: '2026-02-16T03:00:00Z',
        },
        {
          versionId: 21,
          versionNumber: 1,
          publishedFromDraftId: 100,
          rolledBackFromVersionId: null,
          publishedAt: '2026-02-16T02:00:00Z',
        },
      ],
    });

    renderPage();

    await screen.findByText('Draft #101');
    fireEvent.click(screen.getByRole('button', { name: 'Publish Draft' }));

    await waitFor(() => {
      expect(wikiAuthoringService.publishDraft).toHaveBeenCalledWith(1, 101);
    });

    await screen.findByText('Version 2 (latest)');

    fireEvent.click(screen.getByRole('button', { name: 'Rollback to v1' }));

    await waitFor(() => {
      expect(wikiAuthoringService.rollbackPublishedVersion).toHaveBeenCalledWith(1, 1);
    });
  });
});
