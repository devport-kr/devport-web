import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WikiMarkdownRenderer from '../WikiMarkdownRenderer';

describe('WikiMarkdownRenderer', () => {
  it('highlights single-quoted file names and commands as inline code when enabled', () => {
    const { container } = render(
      <WikiMarkdownRenderer
        content="문서는 'README.md'에 있고 설치는 'npm install -g @anthropic-ai/claude-code'로 진행한 뒤 'claude'를 실행합니다."
        highlightQuotedCodeLikeText
      />
    );

    const inlineCodes = Array.from(container.querySelectorAll('code')).map(node => node.textContent);
    expect(inlineCodes).toContain('README.md');
    expect(inlineCodes).toContain('npm install -g @anthropic-ai/claude-code');
    expect(inlineCodes).toContain('claude');
  });

  it('keeps normal quoted prose as plain text', () => {
    const { container } = render(
      <WikiMarkdownRenderer
        content="이 문장은 'hello' 같은 일반 인용어는 그대로 둡니다."
        highlightQuotedCodeLikeText
      />
    );

    expect(container.querySelector('code')).toBeNull();
  });
});
