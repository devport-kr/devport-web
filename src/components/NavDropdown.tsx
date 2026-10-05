import { Link } from 'react-router-dom';
import { isNavItemActive } from '../config/navigation';
import type { NavGroup, NavItem } from '../config/navigation';

interface NavDropdownProps {
  group: NavGroup;
  pathname: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// Shared look for top-level navbar entries: full bar height so the active
// underline sits on the navbar's bottom border
const navTriggerClasses = (isActive: boolean, isOpen = false) =>
  `flex items-center gap-1 h-full px-3 border-b-2 text-sm font-medium transition-colors ${
    isActive ? 'border-accent' : 'border-transparent'
  } ${isActive || isOpen ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`;

interface NavTopLinkProps {
  item: NavItem;
  isActive: boolean;
}

export function NavTopLink({ item, isActive }: NavTopLinkProps) {
  return (
    <Link to={item.path} aria-current={isActive ? 'page' : undefined} className={navTriggerClasses(isActive)}>
      {item.label}
    </Link>
  );
}

export default function NavDropdown({ group, pathname, isActive, isOpen, onToggle, onClose }: NavDropdownProps) {
  const menuId = `nav-menu-${group.id}`;

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={navTriggerClasses(isActive, isOpen)}
      >
        {group.label}
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute left-0 top-full mt-1 min-w-[11rem] p-1.5 bg-surface-card border border-surface-border rounded-xl shadow-soft animate-fade-in"
        >
          {group.items.map((item) => {
            const isItemActive = isNavItemActive(item, pathname);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={onClose}
                aria-current={isItemActive ? 'page' : undefined}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isItemActive
                    ? 'text-accent bg-accent/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
