import type { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// GFM adds tables, task lists and ~~strikethrough~~. Single "~" stays literal:
// Korean text uses it for ranges ("3~5초, 10~20%"), which GFM's default
// single-tilde strikethrough would turn into struck-out text.
export const remarkPlugins: Options['remarkPlugins'] = [[remarkGfm, { singleTilde: false }]];

// Plain-text excerpt of a Markdown summary, for card previews
export const stripMarkdown = (markdown: string) => {
  const plainText = markdown
    // remove fenced code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // inline code
    .replace(/`[^`]*`/g, '')
    // images are dropped: repo write-ups embed README screenshots, and their
    // alt text ("데모 화면") reads as noise in an excerpt
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // links left empty by a removed image: [![alt](img)](url)
    .replace(/\[\s*\]\([^)]*\)/g, '')
    // links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // headings #### Title -> Title
    .replace(/^#{1,6}\s*/gm, '')
    // blockquotes
    .replace(/^\s*>+\s?/gm, '')
    // unordered lists
    .replace(/^\s*[-*+]\s+/gm, '')
    // ordered lists
    .replace(/^\s*\d+\.\s+/gm, '')
    // emphasis/bold/strikethrough
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // collapse whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText || markdown;
};
