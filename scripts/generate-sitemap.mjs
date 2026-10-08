// Writes dist/sitemap.xml after `vite build`.
//
// Static pages, blog posts and Ports content come from the repo. Articles come
// from the live API; if it is unreachable the sitemap is still written without
// them so a deploy never fails because of it. The deploy workflow also runs on
// a daily schedule so newly crawled articles reach the sitemap.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://devport.kr';
const API_BASE_URL = process.env.SITEMAP_API_BASE_URL || SITE_URL;
const PAGE_SIZE = 500;
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** @type {{ path: string; lastmod?: string }[]} */
const entries = [];
const add = (path, lastmod) => entries.push({ path, lastmod: lastmod?.slice(0, 10) || undefined });

const listFiles = (dir, extension) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir))
        .filter((name) => name.endsWith(extension))
        .map((name) => join(ROOT, dir, name))
    : [];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

// ─── Static pages ────────────────────────────────────────────────
for (const path of ['/', '/llm-rankings', '/trending-repos', '/ports', '/blog', '/terms', '/privacy']) add(path);

// ─── Blog (blog/*.md, slug = filename) ───────────────────────────
for (const file of listFiles('blog', '.md')) {
  const slug = file.split('/').pop().replace(/\.md$/, '');
  const date = readFileSync(file, 'utf8').match(/^date:\s*(\S+)/m)?.[1];
  add(`/blog/${slug}`, date);
}

// ─── Ports (ports-content/*, written by portki) ──────────────────
if (existsSync(join(ROOT, 'ports-content'))) {
  for (const path of ['/ports/pulse', '/ports/topics', '/ports/routes', '/ports/projects']) add(path);
  for (const file of listFiles('ports-content/pulse', '.json')) {
    const pulse = readJson(file);
    add(`/ports/pulse/${pulse.week.toLowerCase()}`, pulse.publishedAt);
  }
  for (const file of listFiles('ports-content/topics', '.json')) {
    const topic = readJson(file);
    add(`/ports/topics/${topic.slug}`, topic.updatedAt);
  }
  for (const file of listFiles('ports-content/routes', '.json')) {
    const route = readJson(file);
    add(`/ports/routes/${route.slug}`, route.updatedAt);
  }
}

// ─── Articles (live API) ─────────────────────────────────────────
async function fetchArticles() {
  const seen = new Set();
  for (let page = 0; ; page++) {
    const response = await fetch(`${API_BASE_URL}/api/articles?page=${page}&size=${PAGE_SIZE}`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GET /api/articles page ${page}: HTTP ${response.status}`);
    const data = await response.json();
    for (const article of data.content) {
      // Pages shift while the crawler inserts, so the same article can show up twice
      if (seen.has(article.externalId)) continue;
      seen.add(article.externalId);
      add(`/articles/${article.externalId}`, article.createdAtSource);
    }
    if (!data.hasMore || data.content.length === 0) return seen.size;
  }
}

const staticCount = entries.length;
let articleCount = 0;
try {
  articleCount = await fetchArticles();
} catch (error) {
  console.warn(`[sitemap] Articles skipped: ${error.message}`);
}

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(
    ({ path, lastmod }) =>
      `  <url><loc>${escapeXml(SITE_URL + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
  ),
  '</urlset>',
  '',
].join('\n');

writeFileSync(join(ROOT, 'dist', 'sitemap.xml'), xml);
console.log(`[sitemap] dist/sitemap.xml: ${staticCount} pages + ${articleCount} articles`);
