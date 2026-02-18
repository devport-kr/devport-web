import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WikiAnchorRail from '../WikiAnchorRail';

describe('WikiAnchorRail', () => {
  it('renders dynamic anchor headings and scrolls to anchor section id', () => {
    const scrollIntoView = vi.fn();
    const section = document.createElement('section');
    section.id = 'section-architecture-test';
    section.scrollIntoView = scrollIntoView;
    document.body.appendChild(section);

    render(
      <WikiAnchorRail
        anchors={[
          { sectionId: 'architecture', heading: 'Architecture', anchor: 'architecture-test' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Architecture' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    document.body.removeChild(section);
  });
});
