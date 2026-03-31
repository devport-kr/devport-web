import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchAutocomplete } from '../services/search/searchService';
import type { ArticleAutocompleteResponse } from '../services/search/searchService';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [suggestions, setSuggestions] = useState<ArticleAutocompleteResponse[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
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
    }, 300); // 300ms debounce

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
    <nav className="bg-surface/80 backdrop-blur-xl border-b border-surface-border/50 sticky top-0 z-50">
      <div className="px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Search */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-1 group"
            >
              <span className="text-xl font-semibold text-text-primary tracking-tight">
                devport
              </span>
              <span className="text-accent text-xl font-semibold">.</span>
            </Link>

            {/* Search Bar */}
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
                    className="w-64 pl-10 pr-4 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
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

          {/* Right side actions */}
          <div className="flex items-center gap-3">
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
                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-card rounded-xl shadow-soft border border-surface-border py-1 animate-fade-in">
                    <div className="px-4 py-3 border-b border-surface-border">
                      <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                      <p className="text-xs text-text-muted truncate mt-0.5">{user?.email}</p>
                    </div>
                    <Link
                      to="/mypage"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      마이페이지
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-surface-hover transition-colors"
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

          </div>
        </div>
      </div>
    </nav>
  );
}
