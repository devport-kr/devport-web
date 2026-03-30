# Plan: Mobile Navigation, Footer Fixes & Blog Link

## Overview
Four problem areas to address:
1. Mobile users can't navigate beyond the main page (no working mobile nav)
2. Footer uses placeholder `href="#"` links, shows year 2025, is missing from several pages
3. "Blog" link missing from footer
4. Footer not visible on: PortsDirectoryPage, SearchResultsPage, MyPage, PortsProjectPage

---

## 1. Mobile Navigation — Bottom Tab Bar

**Problem:** The left `<Sidebar>` (홈, 마이페이지, LLM 랭킹, Ports) is hidden on `lg:hidden`. The hamburger button in `Navbar.tsx` is a non-functional placeholder with no `onClick` state.

**Solution:** Create a **bottom tab navigation bar** (`MobileBottomNav.tsx`) that is fixed to the bottom of the screen on mobile (`lg:hidden`). This is the standard UX pattern for mobile web apps.

**File to create:** `src/components/MobileBottomNav.tsx`
- 4 tabs: 홈 (`/`), LLM 랭킹 (`/llm-rankings`), Ports (`/ports`), 마이페이지 (`/mypage` or `/login` for guests)
- Active state with accent color highlight
- Icons matching those already in `Sidebar.tsx`
- Fixed at bottom (`fixed bottom-0 left-0 right-0 z-50`)
- Background: `bg-surface border-t border-surface-border`
- Safe area padding for iPhone notches: `pb-safe` or `pb-4`

**Pages to update (add `<MobileBottomNav />` and bottom padding):**
- `HomePage.tsx` — add `<MobileBottomNav />`, add `pb-16 lg:pb-0` to main content
- `LLMRankingsPage.tsx` — same
- `ArticleDetailPage.tsx` — same
- `SearchResultsPage.tsx` — same
- `PortsDirectoryPage.tsx` — same
- `PortsProjectPage.tsx` — same
- `MyPage.tsx` — same

**Hamburger button in Navbar:** Remove or repurpose. Since we're using a bottom tab bar, the hamburger can be removed (the mobile nav is now always visible at the bottom). This simplifies the implementation significantly.

---

## 2. Extract Shared Footer Component

**Problem:** Footer is copy-pasted in 3 pages with inconsistent markup, broken `href="#"` links, and year 2025.

**Solution:** Create `src/components/Footer.tsx` as a shared component.

**File to create:** `src/components/Footer.tsx`
- Props: `className?: string` for sidebar offset support
- **Links:**
  - Blog → `/` (the main articles feed IS the blog)
  - Privacy → `/privacy` (existing route)
  - Terms → `/terms` (existing route)
  - ~~About~~ (no About page exists, keep as placeholder or remove)
- **Year:** `© 2026 devport.kr`
- **Layout:** Brand name + tagline on left, links on right (existing style)
- Use `<Link>` from react-router-dom for internal routes

**Replace inline footers in:**
- `HomePage.tsx` — replace inline `<footer>` with `<Footer />`
- `LLMRankingsPage.tsx` — replace inline `<footer>` with `<Footer className="lg:ml-52 xl:mr-52" />`
- `ArticleDetailPage.tsx` — replace inline `<footer>` with `<Footer className="lg:ml-52" />`

---

## 3. Add Footer to Pages That Are Missing It

**Pages without any footer:**
- `SearchResultsPage.tsx` — add `<Footer className="lg:ml-52" />`
- `PortsDirectoryPage.tsx` — add `<Footer className="lg:ml-52" />`
- `MyPage.tsx` — add `<Footer className="lg:ml-52" />`
- `PortsProjectPage.tsx` — add `<Footer className="lg:ml-52" />`

---

## 4. File Change Summary

| File | Action |
|------|--------|
| `src/components/MobileBottomNav.tsx` | **CREATE** — bottom tab bar |
| `src/components/Footer.tsx` | **CREATE** — shared footer component |
| `src/components/Navbar.tsx` | **EDIT** — remove non-functional hamburger button |
| `src/pages/HomePage.tsx` | **EDIT** — add MobileBottomNav + Footer, add bottom padding |
| `src/pages/LLMRankingsPage.tsx` | **EDIT** — replace inline footer, add MobileBottomNav |
| `src/pages/ArticleDetailPage.tsx` | **EDIT** — replace inline footer, add MobileBottomNav |
| `src/pages/SearchResultsPage.tsx` | **EDIT** — add Footer + MobileBottomNav |
| `src/pages/PortsDirectoryPage.tsx` | **EDIT** — add Footer + MobileBottomNav |
| `src/pages/PortsProjectPage.tsx` | **EDIT** — add Footer + MobileBottomNav |
| `src/pages/MyPage.tsx` | **EDIT** — add Footer + MobileBottomNav |

---

## Design Notes
- MobileBottomNav must use `lg:hidden` to only appear on mobile/tablet (< 1024px) — exactly where the Sidebar disappears
- Pages already have `pb-8` on main; add extra `lg:pb-0 pb-20` to ensure content not hidden behind bottom nav
- Footer's `className` prop handles the sidebar margin offsets (different pages have different sidebar configurations)
- Blog link in footer goes to `/` which is the articles feed (no dedicated "blog" page exists)
