import { useState } from 'react';

export default function Navbar() {
  const [activeTab, setActiveTab] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'mypage', label: '마이페이지' },
  ];

  return (
    <nav className="bg-primary-base shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
            <span className="text-xl font-bold">DevPort</span>
          </a>

          {/* Navigation Links */}
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => setActiveTab(link.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === link.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <button className="hidden md:block text-white/90 hover:text-white transition-colors font-medium border-b border-transparent hover:border-white pb-0.5">
              구독하기
            </button>
            <button className="hidden md:flex items-center gap-2 bg-white text-primary-base px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <span>로그인</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 12 12">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.333 2.667L7.667 6 4.333 9.333" />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button className="md:hidden text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
