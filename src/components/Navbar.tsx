import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchAutocomplete } from '../services/search/searchService';
import type { ArticleAutocompleteResponse } from '../services/search/searchService';
import { primaryNav, isNavEntryActive, isNavItemActive } from '../config/navigation';
import type { NavItem } from '../config/navigation';
import NavDropdown, { NavItemContent, NavTopLink } from './NavDropdown';
import { menuItemClasses, menuPanelClasses } from './navMenuStyles';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openNavMenu, setOpenNavMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [suggestions, setSuggestions] = useState<ArticleAutocompleteResponse[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close mobile menu and nav dropdowns on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setOpenNavMenu(null);
  }, [location.pathname]);

  // Close nav dropdowns on Escape
  useEffect(() => {
    if (!openNavMenu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenNavMenu(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openNavMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Close autocomplete, nav dropdowns and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target as Node)) {
        setOpenNavMenu(null);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowAutocomplete(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await searchAutocomplete(searchQuery);
        setSuggestions(response.suggestions);
        setTotalMatches(response.totalMatches);
        setShowAutocomplete(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setShowAutocomplete(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (externalId: string) => {
    setShowAutocomplete(false);
    setSearchQuery('');
    navigate(`/articles/${externalId}`);
  };

  const handleViewAllResults = () => {
    setShowAutocomplete(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      AI_LLM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      DEVOPS_SRE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      BACKEND: 'bg-green-500/10 text-green-400 border-green-500/20',
      FRONTEND: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      DATABASE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      INFRA_CLOUD: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      MOBILE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      SECURITY: 'bg-red-500/10 text-red-400 border-red-500/20',
      BLOCKCHAIN: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      DATA_SCIENCE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      ARCHITECTURE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      OTHER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[category] || colors.OTHER;
  };

  return (
    // Sticky lives on the wrapper: a sticky child inside an equally tall parent never sticks
    <div ref={mobileMenuRef} className="sticky top-0 z-50">
      <nav
        className="bg-surface/80 backdrop-blur-xl border-b border-surface-border/50"
        style={{
          WebkitTransform: 'translate3d(0,0,0)',
          transform: 'translate3d(0,0,0)',
        }}
      >
        <div className="px-4 md:px-8">
          {/* Three columns with equal side tracks keep the primary nav centered on the bar */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 h-16">
            {/* Logo and Search */}
            <div className="justify-self-start flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-1 group"
              >
                <span className="text-xl font-semibold text-text-primary tracking-tight">
                  devport
                </span>
                <span className="text-accent text-xl font-semibold">.</span>
              </Link>

              {/* Search Bar – desktop only */}
              <div className="hidden md:flex items-center">
                <div ref={searchRef} className="relative">
                  <form onSubmit={handleSearchSubmit}>
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 xl:w-64 pl-10 pr-4 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                    />
                  </form>

                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && (
                    <div className="absolute top-full mt-2 w-96 bg-surface-card border border-surface-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                        </div>
                      ) : suggestions.length > 0 ? (
                        <>
                          <div className="max-h-96 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion.externalId}
                                onClick={() => handleSuggestionClick(suggestion.externalId)}
                                className="w-full px-4 py-3 hover:bg-surface-hover transition-colors text-left border-b border-surface-border last:border-b-0"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-text-primary font-medium truncate">
                                      {suggestion.summaryKoTitle}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded border ${getCategoryBadgeColor(
                                          suggestion.category
                                        )}`}
                                      >
                                        {suggestion.category.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-xs text-text-muted">
                                        {suggestion.source}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                          {totalMatches > suggestions.length && (
                            <button
                              onClick={handleViewAllResults}
                              className="w-full px-4 py-3 text-sm text-accent hover:text-accent-light bg-surface-hover hover:bg-surface-border transition-colors font-medium"
                            >
                              모든 결과 보기 ({totalMatches.toLocaleString()}개)
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="p-4 text-center text-sm text-text-muted">
                          검색 결과가 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Primary nav – desktop only (mobile uses the slide-down menu) */}
            <div ref={desktopNavRef} className="hidden lg:flex items-stretch self-stretch">
              {primaryNav.map((entry) =>
                entry.type === 'group' ? (
                  <NavDropdown
                    key={entry.id}
                    group={entry}
                    pathname={location.pathname}
                    isActive={isNavEntryActive(entry, location.pathname)}
                    isOpen={openNavMenu === entry.id}
                    onToggle={() => setOpenNavMenu((prev) => (prev === entry.id ? null : entry.id))}
                    onClose={() => setOpenNavMenu(null)}
                  />
                ) : (
                  <NavTopLink
                    key={entry.id}
                    item={entry}
                    isActive={isNavEntryActive(entry, location.pathname)}
                  />
                )
              )}
            </div>

            {/* Right side actions – pinned to the last column even when the nav is hidden */}
            <div className="col-start-3 justify-self-end flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={user?.profileImageUrl || 'https://via.placeholder.com/40'}
                      alt={user?.name || 'User'}
                      className="w-8 h-8 rounded-full ring-1 ring-surface-border"
                    />
                    <span className="hidden md:block text-sm text-text-secondary">
                      {user?.name}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    // mt-6 lines the panel up with the nav dropdowns, 8px below the bar
                    <div className={`absolute right-0 top-full mt-6 w-56 ${menuPanelClasses}`}>
                      <div className="px-3 pt-2 pb-2.5 mb-1.5 border-b border-surface-border/60">
                        <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                        <p className="text-xs text-text-muted truncate mt-0.5">{user?.email}</p>
                      </div>
                      <Link
                        to="/mypage"
                        className={`${menuItemClasses(location.pathname === '/mypage')} gap-2.5 px-3 py-2`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        마이페이지
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.04] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button className="hidden md:block text-sm text-text-muted hover:text-text-secondary transition-colors">
                    구독하기
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                  >
                    로그인
                  </button>
                </>
              )}

              {/* Mobile menu toggle – visible only on mobile */}
              <button
                onClick={() => setShowMobileMenu(prev => !prev)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                aria-label="메뉴"
              >
                {showMobileMenu ? (
                  /* X icon when open */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* Hamburger icon when closed */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu – scrolls when taller than the viewport */}
      {showMobileMenu && (
        <div className="lg:hidden absolute top-full left-0 right-0 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-surface/95 backdrop-blur-xl border-b border-surface-border/50 shadow-menu animate-menu-in"
          style={{ WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}
        >
          <div className="px-4 py-3 space-y-3">
            {primaryNav.map((entry) =>
              entry.type === 'group' ? (
                <div key={entry.id}>
                  <p className="px-3 pt-1 pb-1.5 text-xs font-medium text-text-muted">{entry.label}</p>
                  <div className="space-y-1">
                    {entry.items.map((item) => (
                      <MobileNavLink key={item.id} item={item} isActive={isNavItemActive(item, location.pathname)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div key={entry.id} className="pt-3 border-t border-surface-border/50">
                  <MobileNavLink item={entry} isActive={isNavItemActive(entry, location.pathname)} />
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      className={`${menuItemClasses(isActive)} group justify-between px-3 py-3 font-medium`}
    >
      <NavItemContent item={item} isActive={isActive} />
    </Link>
  );
}
