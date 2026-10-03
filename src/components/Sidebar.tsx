import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { navItems, isNavItemActive } from './navItems';

const GITHUB_ISSUES_URL = 'https://github.com/devport-kr/devport-web/issues/new';

interface SidebarProps {
  compact?: boolean;
}

export default function Sidebar({ compact = false }: SidebarProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Compact mode collapses to icons and expands on hover
  const sidebarClasses = compact ? 'w-14 group hover:w-52 px-2' : 'w-52 px-3';
  const revealClasses = compact
    ? 'overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100'
    : '';
  // Whole blocks (section label, footer links) only appear once a compact sidebar expands
  const revealBlock = compact ? 'hidden group-hover:block' : '';

  return (
    <aside
      className={`${sidebarClasses} h-full py-5 flex flex-col border-r border-surface-border bg-surface transition-[width] duration-200 ease-in-out`}
    >
      <p className={`caption px-3 mb-2 whitespace-nowrap ${revealBlock}`}>메뉴</p>

      <nav className="flex flex-col gap-0.5" aria-label="주 메뉴">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item, location.pathname);
          const linkPath = item.authPath && !isAuthenticated ? item.authPath : item.path;
          const Icon = item.icon;
          const layout = compact
            ? 'justify-center gap-0 px-2 group-hover:justify-start group-hover:gap-3 group-hover:px-3'
            : 'justify-start gap-3 px-3';

          return (
            <Link
              key={item.id}
              to={linkPath}
              title={compact ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center ${layout} h-10 rounded text-sm font-medium transition-colors ${isActive
                ? 'bg-surface-hover text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/60'
                }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent" aria-hidden="true" />}
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-accent' : ''}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className={revealClasses}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer links live here too: the home feed scrolls forever, so the page footer is rarely reached */}
      <div className={`mt-auto px-3 pt-4 border-t border-surface-border whitespace-nowrap ${revealBlock}`}>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-text-muted">
          <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">
            피드백
          </a>
          <Link to="/privacy" className="hover:text-text-primary transition-colors">개인정보</Link>
          <Link to="/terms" className="hover:text-text-primary transition-colors">약관</Link>
        </div>
        <p className="mt-2 font-mono text-[11px] text-text-muted/70">© {new Date().getFullYear()} devport.kr</p>
      </div>
    </aside>
  );
}
