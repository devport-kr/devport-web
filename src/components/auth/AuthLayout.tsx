import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Wordmark from '../Wordmark';

interface AuthLayoutProps {
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// What devport offers, listed on the left of every auth screen
const manifest = [
  { label: 'Feed', text: '해외 기술 아티클을 한국어로 요약' },
  { label: 'Ports', text: '오픈소스 프로젝트 위키와 portki 챗봇' },
  { label: 'Rankings', text: 'LLM 벤치마크 리더보드' },
];

export default function AuthLayout({ kicker, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-surface-border bg-surface/85 backdrop-blur-xl">
        <Link to="/" aria-label="devport 홈" className="rounded">
          <Wordmark />
        </Link>
        <Link
          to="/"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted hover:text-text-primary transition-colors"
        >
          ← 홈으로
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Brand panel – desktop only */}
        <section className="hidden lg:flex flex-col justify-between border-r border-surface-border bg-surface/50 px-12 xl:px-16 py-14">
          <div>
            <p className="label-mono">devport.kr</p>
            <h1 className="mt-4 text-4xl xl:text-[2.75rem] font-semibold leading-[1.2] tracking-[-0.02em] text-text-primary">
              노이즈는 줄이고,
              <br />
              맥락은 남깁니다.
            </h1>
            <p className="mt-5 max-w-md text-[15px] text-text-secondary leading-relaxed">
              개발자를 위한 글로벌 트렌드 포털. 매일 쏟아지는 기술 소식을 한국어로 정리해 전합니다.
            </p>

            <dl className="mt-12 max-w-md border-y border-dashed border-surface-border-strong divide-y divide-dashed divide-surface-border-strong">
              {manifest.map((row) => (
                <div key={row.label} className="flex items-baseline gap-6 py-3.5">
                  <dt className="w-20 shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                    {row.label}
                  </dt>
                  <dd className="text-sm text-text-secondary">{row.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="font-mono text-[11px] text-text-muted">© {new Date().getFullYear()} devport.kr</p>
        </section>

        {/* Form column */}
        <section className="flex justify-center px-4 sm:px-6 py-10 sm:py-14 lg:items-center">
          <div className="w-full max-w-[420px]">
            <div className="mb-7">
              <p className="label-mono">{kicker}</p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.01em] text-text-primary">{title}</h2>
              {subtitle && <p className="mt-2 text-sm text-text-muted leading-relaxed">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-8 pt-6 border-t border-surface-border">{footer}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
