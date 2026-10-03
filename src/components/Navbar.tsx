import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { searchAutocomplete } from '../services/search/searchService';
import type { ArticleAutocompleteResponse } from '../services/search/searchService';
import { getCategoryInfo } from '../types';
import Wordmark from './Wordmark';
import { navItems, isNavItemActive } from './navItems';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [suggestions, setSuggestions] = useState<ArticleAutocompleteResponse[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close menus on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Close autocomplete and menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowAutocomplete(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // "/" focuses search, Escape closes open menus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAutocomplete(false);
        setShowUserMenu(false);
        setShowMobileMenu(false);
        return;
      }
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (!searchInputRef.current || searchInputRef.current.offsetParent === null) return;
      event.preventDefault();
      searchInputRef.current.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
      setShowMobileMenu(false);
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

  const userInitial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    // Sticky lives on the wrapper: a sticky child of an equally tall parent never sticks
    <div ref={mobileMenuRef} className="sticky top-0 z-50">
      <nav
        className="relative bg-surface/85 backdrop-blur-xl border-b border-surface-border"
        style={{
          WebkitTransform: 'translate3d(0,0,0)',
          transform: 'translate3d(0,0,0)',
        }}
      >
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo and Search */}
            <div className="flex items-center gap-6 min-w-0">
              <Link to="/" className="flex items-center rounded" aria-label="devport 홈">
                <Wordmark />
              </Link>

              {/* Search Bar – desktop only */}
              <div className="hidden md:flex items-center">
                <div ref={searchRef} className="relative">
                  <form onSubmit={handleSearchSubmit} role="search">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="아티클 검색"
                      aria-label="아티클 검색"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowAutocomplete(true)}
                      className="w-72 h-9 pl-9 pr-10 bg-surface-sunken border border-surface-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                    />
                    <kbd className="kbd absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">/</kbd>
                  </form>

                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && (
                    <div className="absolute top-full mt-2 w-[26rem] panel shadow-overlay overflow-hidden z-50 animate-fade-in">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border">
                        <span className="label-mono">검색 결과</span>
                        {!isSearching && (
                          <span className="font-mono text-[11px] text-text-muted tabular-nums">
                            {totalMatches.toLocaleString()}건
                          </span>
                        )}
                      </div>
                      {isSearching ? (
                        <div className="p-4 flex justify-center">
                          <div className="w-5 h-5 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                        </div>
                      ) : suggestions.length > 0 ? (
                        <>
                          <ul className="max-h-96 overflow-y-auto scrollbar-minimal">
                            {suggestions.map((suggestion) => {
                              const category = getCategoryInfo(suggestion.category);
                              return (
                                <li key={suggestion.externalId}>
                                  <button
                                    onClick={() => handleSuggestionClick(suggestion.externalId)}
                                    className="w-full px-4 py-3 hover:bg-surface-hover transition-colors text-left border-b border-surface-border/60"
                                  >
                                    <p className="text-sm text-text-primary font-medium truncate">
                                      {suggestion.summaryKoTitle}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 font-mono text-[11px] uppercase tracking-[0.04em] text-text-muted min-w-0">
                                      <span className={`inline-flex items-center gap-1.5 shrink-0 ${category.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${category.dot}`} />
                                        {category.label}
                                      </span>
                                      <span className="text-surface-border-strong">/</span>
                                      <span className="truncate">{suggestion.source}</span>
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                          {totalMatches > suggestions.length && (
                            <button
                              onClick={handleViewAllResults}
                              className="w-full flex items-center justify-between px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-accent hover:bg-surface-hover transition-colors"
                            >
                              <span>모든 결과 보기</span>
                              <span className="tabular-nums">{totalMatches.toLocaleString()} →</span>
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

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 h-9 pl-1 pr-2 rounded hover:bg-surface-hover transition-colors"
                  >
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt=""
                        className="w-7 h-7 rounded-full ring-1 ring-surface-border-strong object-cover"
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-surface-hover ring-1 ring-surface-border-strong flex items-center justify-center font-mono text-xs text-text-secondary">
                        {userInitial}
                      </span>
                    )}
                    <span className="hidden md:block text-sm text-text-secondary max-w-[10rem] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div role="menu" className="absolute right-0 mt-2 w-60 panel shadow-overlay py-1 animate-fade-in">
                      <div className="px-4 py-3 border-b border-surface-border">
                        <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                        <p className="font-mono text-[11px] text-text-muted truncate mt-0.5">{user?.email}</p>
                      </div>
                      <Link
                        to="/mypage"
                        role="menuitem"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        마이페이지
                      </Link>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">
                  로그인
                </button>
              )}

              {/* Mobile menu toggle – visible only below lg */}
              <button
                onClick={() => setShowMobileMenu(prev => !prev)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label={showMobileMenu ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={showMobileMenu}
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {showMobileMenu && (
        <div className="lg:hidden absolute top-full left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-surface-border shadow-overlay animate-fade-in"
          style={{ WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}
        >
          <div className="px-4 py-4 space-y-4">
            {/* Search – mobile only (desktop has it in the bar) */}
            <form onSubmit={handleSearchSubmit} role="search" className="relative md:hidden">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <input
                type="text"
                enterKeyHint="search"
                placeholder="아티클 검색"
                aria-label="아티클 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9"
              />
            </form>

            <div>
              <p className="label-mono px-3 mb-2">메뉴</p>
              <nav className="space-y-0.5" aria-label="모바일 메뉴">
                {navItems.map((item) => {
                  const linkPath = item.authPath && !isAuthenticated ? item.authPath : item.path;
                  const isActive = isNavItemActive(item, location.pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={linkPath}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex items-center gap-3 px-3 py-3 rounded text-sm font-medium transition-colors ${isActive
                        ? 'text-text-primary bg-surface-hover'
                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                        }`}
                    >
                      {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent" aria-hidden="true" />}
                      <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-accent' : ''}`} strokeWidth={1.75} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">{item.hint}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
