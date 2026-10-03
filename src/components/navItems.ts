import { Anchor, ChartColumn, Newspaper, UserRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  /** Where to send signed-out users instead of `path` */
  authPath?: string;
  icon: LucideIcon;
}

// Shared by the desktop sidebar and the mobile menu
export const navItems: NavItem[] = [
  { id: 'home', label: '홈', path: '/', icon: Newspaper },
  { id: 'ports', label: 'Ports', path: '/ports', icon: Anchor },
  { id: 'llm-rankings', label: 'LLM 랭킹', path: '/llm-rankings', icon: ChartColumn },
  { id: 'mypage', label: '마이페이지', path: '/mypage', authPath: '/login', icon: UserRound },
];

export const isNavItemActive = (item: NavItem, pathname: string) =>
  item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`);
