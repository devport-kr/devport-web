import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stripMarkdown } from './markdown';

export const SITE_URL = 'https://devport.kr';
export const SITE_NAME = 'devport';
export const DEFAULT_TITLE = 'devport · 해외 개발 트렌드를 한국어로';
export const DEFAULT_DESCRIPTION =
  'GitHub, Hacker News, Reddit, Dev.to에서 화제가 된 개발 글과 급상승 저장소, LLM 벤치마크 랭킹을 한국어로 정리해 한곳에서 보여줍니다.';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export interface PageMeta {
  /** Page title; " | devport" is appended. Omit for the default site title. */
  title?: string;
  description?: string;
  /** Canonical path. Defaults to the current path without a trailing slash. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  /** Keeps the page out of search results (login, search results, 404 …) */
  noindex?: boolean;
  /** schema.org structured data for this page */
  jsonLd?: Record<string, unknown>;
}

/** Plain-text meta description from Markdown, cut at about 155 characters. */
export function toDescription(markdown: string, max = 155): string {
  const text = stripMarkdown(markdown);
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (content === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

function setJsonLd(json: string | null) {
  let element = document.head.querySelector<HTMLScriptElement>('script#page-jsonld');
  if (json === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('script');
    element.id = 'page-jsonld';
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }
  element.textContent = json;
}

/**
 * Sets the document title, description, canonical URL, Open Graph tags and
 * robots directive for the current page. Every routed page calls this so
 * tags from the previous page never linger after client-side navigation.
 */
export function usePageMeta({ title, description, path, image, type = 'website', noindex = false, jsonLd }: PageMeta) {
  const { pathname } = useLocation();
  const canonicalPath = path ?? (pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/');
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const json = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const url = `${SITE_URL}${canonicalPath}`;
    document.title = fullTitle;
    setMeta('name', 'description', metaDescription);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : null);
    setCanonical(noindex ? null : url);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', metaDescription);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:image', metaImage);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', metaDescription);
    setMeta('name', 'twitter:image', metaImage);
    setJsonLd(json);
  }, [canonicalPath, fullTitle, metaDescription, metaImage, type, noindex, json]);
}
