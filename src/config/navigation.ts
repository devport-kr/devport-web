export interface NavItem {
  id: string;
  label: string;
  path: string;
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
    id: 'explore',
    label: '둘러보기',
    items: [
      { id: 'dev-news', label: 'dev뉴스', path: '/', activeOn: ['/articles', '/article', '/search'] },
      { id: 'llm-rankings', label: 'LLM 랭킹', path: '/llm-rankings' },
      { id: 'ports', label: 'ports', path: '/ports' },
    ],
  },
  {
    type: 'group',
    id: 'products',
    label: '제품',
    items: [
      { id: 'devport-mcp', label: 'devport MCP', path: '/products/mcp' },
    ],
  },
  { type: 'link', id: 'blog', label: '블로그', path: '/blog' },
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
