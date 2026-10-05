import { stripMarkdown } from '../../lib/markdown';
import type { GitRepo } from '../../types';

export const languageColors: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  default: '#6b7280',
};

export const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString());

// Korean titles often start with "owner/repo: ", which is already shown above the title
export const displayTitle = (repo: GitRepo) => {
  const prefix = `${repo.fullName}:`;
  return repo.summaryKoTitle.startsWith(prefix)
    ? repo.summaryKoTitle.slice(prefix.length).trim()
    : repo.summaryKoTitle;
};

// Summary excerpt without section headings such as "## 개요"
export const summaryExcerpt = (repo: GitRepo) =>
  repo.summaryKoBody
    ? stripMarkdown(repo.summaryKoBody.replace(/^#{1,6}\s.*$/gm, ''))
    : repo.description ?? '';

const MD_IMAGE_URL_RE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/;

export type RepoImage = { src: string; kind: 'image' | 'avatar' };

/**
 * The picture that represents a repo: the API's imageUrl (filled by the crawler,
 * once the API ships it), else the first README image in the summary, else the
 * owner's GitHub avatar.
 */
export const repoMainImage = (repo: GitRepo): RepoImage => {
  if (repo.imageUrl) return { src: repo.imageUrl, kind: 'image' };
  const fromSummary = repo.summaryKoBody?.match(MD_IMAGE_URL_RE)?.[1];
  if (fromSummary) return { src: fromSummary, kind: 'image' };
  return { src: ownerAvatar(repo), kind: 'avatar' };
};

export const ownerAvatar = (repo: GitRepo) => `https://github.com/${repo.fullName.split('/')[0]}.png?size=160`;

// The detail view shows the main image as its header; drop that image from the body so it isn't shown twice
export const withoutImage = (markdown: string, url: string) => {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return markdown
    .replace(new RegExp(`!\\[[^\\]]*\\]\\(\\s*<?${escaped}>?(?:\\s+"[^"]*")?\\s*\\)`), '')
    .replace(/\[\s*\]\([^)]*\)/g, '');
};
