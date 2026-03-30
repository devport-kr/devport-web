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

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface border-t border-surface-border/50">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const linkPath = item.authPath && !isAuthenticated ? item.authPath : item.path;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={linkPath}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span
                className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for devices with home indicator */}
      <div className="h-safe-bottom bg-surface" />
    </nav>
  );
}
