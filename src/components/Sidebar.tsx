import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  {
    id: 'home',
    label: '홈',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'ports',
    label: 'Ports',
    path: '/ports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'llm-rankings',
    label: 'LLM 랭킹',
    path: '/llm-rankings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },

  {
    id: 'mypage',
    label: '마이페이지',
    path: '/mypage',
    authPath: '/login',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  compact?: boolean;
}

export default function Sidebar({ compact = false }: SidebarProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const sidebarCompact = compact;
  const sidebarClasses = sidebarCompact ? 'w-14 group hover:w-52' : 'w-52';
  const sidebarPadding = sidebarCompact ? 'px-2' : 'px-4';

  const linkLabelClasses = sidebarCompact
    ? 'inline-flex whitespace-nowrap overflow-hidden max-w-0 opacity-0 ml-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 group-hover:ml-3'
    : '';
  const iconClasses = 'shrink-0';

  return (
    <aside
      className={`${sidebarClasses} ${sidebarPadding} h-full py-6 border-r border-surface-border/30 bg-surface transition-[width] duration-200 ease-in-out`}
    >
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const linkPath = item.authPath && !isAuthenticated ? item.authPath : item.path;
          const linkPadding = sidebarCompact ? 'px-2' : 'px-3';
          const linkGap = sidebarCompact ? 'gap-0' : 'gap-3';
          const compactState = sidebarCompact ? 'justify-center group-hover:justify-start group-hover:gap-2' : 'justify-start';

          return (
            <Link
              key={item.id}
              to={linkPath}
              className={`flex items-center ${linkGap} ${linkPadding} py-2.5 rounded-lg text-sm font-medium transition-all ${compactState
                } ${isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-card/50'
                }`}
            >
              <span className={iconClasses}>{item.icon}</span>
              <span className={linkLabelClasses}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
