// Shared look for the navbar's menus (nav dropdowns, account menu, mobile sheet):
// the navbar's own surface, white-alpha hovers, and the current page in white
// with an accent dot (echoing the navbar's accent underline)

export const menuPanelClasses =
  'p-1.5 rounded-2xl border border-surface-border/60 bg-surface shadow-menu animate-menu-in';

// Padding and gap are left to the caller (mobile rows need larger tap targets)
export const menuItemClasses = (isActive = false) =>
  `flex items-center rounded-lg text-sm transition-colors ${
    isActive
      ? 'text-text-primary bg-white/[0.06]'
      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
  }`;
