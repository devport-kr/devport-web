import type { ComponentType } from 'react';
import HomeIcon from '../components/icons/HomeIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import PortsIcon from '../components/icons/PortsIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import PuzzleIcon from '../components/icons/PuzzleIcon';
import PencilIcon from '../components/icons/PencilIcon';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  /** Shown next to the label in menus (dropdowns, mobile sheet); the top bar stays text-only */
  icon: ComponentType<{ className?: string }>;
  /** Additional path prefixes that should also mark this item as active */
  activeOn?: string[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export type NavEntry =
  | ({ type: 'group' } & NavGroup)
  | ({ type: 'link' } & NavItem);

// Single source of truth for the top navbar (desktop dropdowns + mobile menu)
export const primaryNav: NavEntry[] = [
  {
    type: 'group',
    id: 'dev',
    label: 'dev',
    items: [
      { id: 'news', label: '뉴스', path: '/', icon: HomeIcon, activeOn: ['/articles', '/article', '/search'] },
      { id: 'trending-repos', label: '트렌딩 리포', path: '/trending-repos', icon: TrendingUpIcon },
    ],
  },
  {
    type: 'group',
    id: 'port',
    label: 'port',
    items: [
      { id: 'ports', label: 'ports', path: '/ports', icon: PortsIcon },
      { id: 'llm-rankings', label: 'LLM 랭킹', path: '/llm-rankings', icon: ChartBarIcon },
      { id: 'mcp', label: 'mcp', path: '/products/mcp', icon: PuzzleIcon },
    ],
  },
  { type: 'link', id: 'blog', label: 'blog', path: '/blog', icon: PencilIcon },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const matches = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  // '/' would prefix-match everything, so the root only matches exactly
  if (item.path === '/' ? pathname === '/' : matches(item.path)) return true;
  return (item.activeOn ?? []).some(matches);
}

export function isNavEntryActive(entry: NavEntry, pathname: string): boolean {
  return entry.type === 'group'
    ? entry.items.some((item) => isNavItemActive(item, pathname))
    : isNavItemActive(entry, pathname);
}
