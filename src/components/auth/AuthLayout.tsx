import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, Languages, TrendingUp } from 'lucide-react';

const features = [
  {
    Icon: Languages,
    title: '한국어 요약',
    description: '해외 아티클과 토론의 핵심만 한국어로 정리해 드립니다.',
  },
  {
    Icon: TrendingUp,
    title: '트렌딩 리포 & LLM 랭킹',
    description: 'GitHub 트렌딩 저장소와 벤치마크별 모델 순위를 한눈에.',
  },
  {
    Icon: Bookmark,
    title: '나만의 아카이브',
    description: '아티클을 저장하고 읽은 기록을 언제든 이어서 확인하세요.',
  },
];

function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-0.5 ${className}`}>
      <span className="text-xl font-semibold tracking-tight text-text-primary">devport</span>
      <span className="text-xl font-semibold text-accent">.</span>
    </Link>
  );
}

function BrandPanel() {
  return (
    // Sticky so it stays in view while the longer signup form scrolls
    <aside className="relative hidden overflow-hidden border-r border-surface-border/60 bg-[#0a0e13] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start lg:px-12 lg:pb-12 xl:px-16 xl:pb-16">
      {/* Grid that fades out from the headline, plus two soft glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_45%,black,transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/4 h-[520px] w-[520px] rounded-full bg-accent/20 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-24 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[120px]" />

      {/* Same height as the form column's header so the logo lines up with "홈으로" */}
      <div className="relative flex h-16 items-center">
        <Logo />
      </div>

      <div className="relative my-auto max-w-lg">
        <p className="inline-flex items-center gap-2 rounded-full border border-surface-border/80 bg-white/[0.03] px-3 py-1 text-xs text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-light shadow-[0_0_8px_rgba(88,166,255,0.9)]" />
          개발자를 위한 글로벌 트렌드 포털
        </p>
        <h2 className="mt-6 text-4xl font-semibold leading-[1.25] tracking-tight text-text-primary xl:text-[44px]">
          노이즈는 줄이고,
          <br />
          <span className="bg-gradient-to-r from-accent-light via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            맥락은 남깁니다.
          </span>
        </h2>
        <p className="mt-5 text-[15px] leading-relaxed text-text-muted break-keep">
          전 세계 개발 커뮤니티에서 화제가 된 글과 저장소를 매일 모아, 한국어로 빠르게 읽을 수 있게 정리합니다.
        </p>

        <ul className="mt-10 space-y-5">
          {features.map(({ Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border/80 bg-surface-elevated/80 text-accent-light">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">{title}</p>
                <p className="mt-0.5 text-sm text-text-muted break-keep">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

interface AuthLayoutProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** Link to the other auth page, under the form */
  footer: ReactNode;
}

/** Split-screen shell for the login and signup pages: brand panel on the left (desktop), form on the right. */
export default function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />

      <div className="flex min-h-screen flex-col px-5 sm:px-8">
        <header className="flex h-16 items-center justify-between">
          <Logo className="lg:invisible" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            홈으로
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-[400px] animate-slide-up">
            <h1 className="text-[26px] font-semibold tracking-tight text-text-primary sm:text-[28px]">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted break-keep">{description}</p>

            <div className="mt-8">{children}</div>

            <p className="mt-8 text-center text-sm text-text-muted">{footer}</p>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-text-muted">
          <span>© 2026 devport.kr</span>
          <Link to="/terms" className="transition-colors hover:text-text-secondary">
            이용약관
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-text-secondary">
            개인정보처리방침
          </Link>
        </footer>
      </div>
    </div>
  );
}

/** "또는" separator between the social buttons and the ID form. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-text-muted">
      <span className="h-px flex-1 bg-surface-border" />
      {children}
      <span className="h-px flex-1 bg-surface-border" />
    </div>
  );
}
