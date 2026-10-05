import { Link } from 'react-router-dom';
import { isNavItemActive } from '../config/navigation';
import type { NavGroup, NavItem } from '../config/navigation';
import { menuItemClasses, menuPanelClasses } from './navMenuStyles';

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
  `flex items-center h-full px-3 border-b-2 text-lg font-medium transition-colors ${
    isActive ? 'border-accent' : 'border-transparent'
  } ${isActive || isOpen ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`;

// Menu row content: icon + label, and an accent dot for the current page.
// The row needs the `group` class for the icon's hover color.
export function NavItemContent({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <>
      <span className="flex items-center gap-2.5">
        <item.icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'
          }`}
        />
        {item.label}
      </span>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
    </>
  );
}

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
      </button>

      {isOpen && (
        // Centered under the trigger; the inner panel animates separately so its
        // transform doesn't fight the centering translate
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
          <div id={menuId} className={`min-w-[9rem] ${menuPanelClasses}`}>
            {group.items.map((item) => {
              const isItemActive = isNavItemActive(item, pathname);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  aria-current={isItemActive ? 'page' : undefined}
                  className={`${menuItemClasses(isItemActive)} group justify-between gap-4 px-3 py-2`}
                >
                  <NavItemContent item={item} isActive={isItemActive} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
