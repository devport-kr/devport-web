import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
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
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="검색..."
                  className="w-64 pl-10 pr-4 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
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

            {/* Mobile menu button */}
            <button className="md:hidden text-text-secondary hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
