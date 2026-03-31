import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Google Forms bug report survey link shown in the footer dropdown.
const GOOGLE_SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScUyqrYaXwlHNAfGMHdPltjf52apSuQLfzMOTNux7yGU6MTaw/viewform?usp=publish-editor';

const GITHUB_ISSUES_URL = 'https://github.com/devport-kr/devport-web/issues/new';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const [showBugMenu, setShowBugMenu] = useState(false);
  const bugMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bugMenuRef.current && !bugMenuRef.current.contains(e.target as Node)) {
        setShowBugMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <footer className={`border-t border-surface-border mt-20 ${className}`}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-0.5 mb-2">
              <span className="text-lg font-semibold text-text-primary">devport</span>
              <span className="text-accent text-lg font-semibold">.</span>
            </div>
            <p className="text-sm text-text-muted">노이즈는 줄이고, 맥락은 남깁니다.</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm items-center">
            <Link
              to="/"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/privacy"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              Terms
            </Link>

            {/* Bug Report */}
            <div className="relative" ref={bugMenuRef}>
              <button
                onClick={() => setShowBugMenu((prev) => !prev)}
                className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors"
              >
                Feedback
              </button>

              {showBugMenu && (
                <div className="absolute bottom-full mb-2 right-0 w-52 bg-surface-card border border-surface-border rounded-xl shadow-soft overflow-hidden z-10">
                  <a
                    href={GITHUB_ISSUES_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                    onClick={() => setShowBugMenu(false)}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub Issue
                  </a>
                  <a
                    href={GOOGLE_SURVEY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover transition-colors border-t border-surface-border"
                    onClick={() => setShowBugMenu(false)}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Google 설문
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-surface-border">
          <p className="text-xs text-text-muted text-center">© 2026 devport.kr</p>
        </div>
      </div>
    </footer>
  );
}
