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
    // images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
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
