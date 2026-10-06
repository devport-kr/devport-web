import { stripMarkdown } from '../lib/markdown';

export interface BlogPost {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  excerpt: string;
  content: string;
}

// Each post is a Markdown file in /blog; the filename becomes its URL slug.
// Posts open with a front matter block:
//   ---
//   title: 글 제목
//   date: 2026-04-06
//   description: (optional) list excerpt, defaults to the first paragraph
//   ---
const postFiles = import.meta.glob<string>('../../blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n?/;

const parseFrontMatter = (block: string) =>
  Object.fromEntries(
    block
      .split('\n')
      .filter((line) => line.includes(':'))
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

// First plain paragraph, skipping headings, lists, images, rules and quotes
const firstParagraph = (markdown: string) =>
  markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|[-*+]\s|\d+\.\s|!\[|>|```|---|\|)/.test(block)) ?? '';

// A line holding only an image URL (pasted the Medium way) or a Medium CDN link
const BARE_IMAGE_URL =
  /^\s*(https?:\/\/(?:cdn-images-\d+\.medium\.com\/\S+|\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?\S*)?))\s*$/i;

// Turn bare image URLs into Markdown images, leaving fenced code untouched.
// Blank lines around each image keep it out of the neighbouring paragraph.
const embedBareImageUrls = (markdown: string) => {
  let inFence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      const match = !inFence && line.match(BARE_IMAGE_URL);
      // <...> keeps URLs with parentheses intact
      return match ? `\n![](<${match[1]}>)\n` : line;
    })
    .join('\n');
};

const parsePost = (path: string, raw: string): BlogPost => {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(FRONT_MATTER);
  const meta = match ? parseFrontMatter(match[1]) : {};
  const content = embedBareImageUrls(match ? normalized.slice(match[0].length) : normalized).trim();
  const slug = path.split('/').pop()!.replace(/\.md$/, '');

  return {
    slug,
    title: meta.title || slug,
    date: meta.date || '',
    excerpt: meta.description || stripMarkdown(firstParagraph(content)),
    content,
  };
};

// Newest first
export const blogPosts: BlogPost[] = Object.entries(postFiles)
  .map(([path, raw]) => parsePost(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));

export const getBlogPost = (slug: string) => blogPosts.find((post) => post.slug === slug);

// "2026-04-06" -> "2026년 4월 6일", without Date parsing so the day can't shift by timezone
export const formatPostDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return year && month && day ? `${year}년 ${month}월 ${day}일` : date;
};
