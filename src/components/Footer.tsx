import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';

// Google Forms feedback survey
const GOOGLE_SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScUyqrYaXwlHNAfGMHdPltjf52apSuQLfzMOTNux7yGU6MTaw/viewform?usp=publish-editor';

const GITHUB_ISSUES_URL = 'https://github.com/devport-kr/devport-web/issues/new';

interface FooterProps {
  className?: string;
}

interface FooterLink {
  label: string;
  to?: string;
  href?: string;
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: '서비스',
    links: [
      { label: '홈 피드', to: '/' },
      { label: 'Ports', to: '/ports' },
      { label: 'LLM 랭킹', to: '/llm-rankings' },
    ],
  },
  {
    title: '피드백',
    links: [
      { label: 'GitHub Issue', href: GITHUB_ISSUES_URL },
      { label: 'Google Forms', href: GOOGLE_SURVEY_URL },
    ],
  },
  {
    title: '정책',
    links: [
      { label: '개인정보처리방침', to: '/privacy' },
      { label: '이용약관', to: '/terms' },
    ],
  },
];

const linkClass = 'inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors';

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`border-t border-surface-border bg-surface/60 mt-20 ${className}`}>
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          {/* Brand */}
          <div className="max-w-xs">
            <Wordmark size="md" />
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              노이즈는 줄이고, 맥락은 남깁니다.
            </p>
            <p className="mt-1 text-sm text-text-muted leading-relaxed">
              개발자를 위한 기술 뉴스, 오픈소스 프로젝트, LLM 랭킹을 한곳에서.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <p className="label-mono mb-3">{column.title}</p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className={linkClass}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} target="_blank" rel="noreferrer" className={linkClass}>
                        {link.label}
                        <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.75} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-surface-border font-mono text-[11px] text-text-muted">
          <p>© {new Date().getFullYear()} devport.kr</p>
        </div>
      </div>
    </footer>
  );
}
