import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WikiContentColumn from '../WikiContentColumn';
import type { WikiSnapshot } from '../../../types/wiki';

const snapshot: WikiSnapshot = {
  projectExternalId: 'github:test/repo',
  fullName: 'test/repo',
  generatedAt: '2026-02-16T00:00:00Z',
  hiddenSections: [],
  sections: [],
  anchors: [],
  currentCounters: null,
  rightRail: null,
};

describe('WikiContentColumn', () => {
  it('renders summary first and expands deep dive on interaction', () => {
    render(
      <WikiContentColumn
        snapshot={snapshot}
        sections={[
          {
            sectionId: 'what',
            heading: 'What',
            anchor: 'what-anchor',
            summary: 'Summary first',
            deepDiveMarkdown: '## Deep section',
            defaultExpanded: false,
          },
        ]}
      />
    );

    expect(screen.getByText('Summary first')).toBeTruthy();
    expect(screen.queryByText('Deep section')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '기술 세부사항 펼치기' }));
    expect(screen.getByText('Deep section')).toBeTruthy();
  });
});
