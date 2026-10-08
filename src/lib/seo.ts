import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stripMarkdown } from './markdown';

export const SITE_URL = 'https://devport.kr';
export const SITE_NAME = 'devport';
export const DEFAULT_TITLE = 'devport · 노이즈는 줄이고, 맥락은 남깁니다';
export const DEFAULT_DESCRIPTION =
  '매일 쏟아지는 AI 프로젝트, 많이 보는 것보다 제대로 이해하는 것이 중요합니다. devport는 흩어진 기술을 맥락 중심으로 재구성해 발견부터 이해, 적용까지의 시간을 줄입니다.';
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
