import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Tone = 'info' | 'success' | 'error';

const toneStyles: Record<Tone, { circle: string; icon: string }> = {
  info: {
    circle: 'bg-accent/10 text-accent',
    icon: 'M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  success: {
    circle: 'bg-green-500/10 text-green-400',
    icon: 'M5 13l4 4L19 7',
  },
  error: {
    circle: 'bg-red-500/10 text-red-400',
    icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  },
};

export const newsletterActionButtonClass =
  'block w-full px-5 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed';

interface NewsletterActionCardProps {
  tone: Tone;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

/** Standalone page shell for the public pages opened from newsletter email links. */
export default function NewsletterActionCard({ tone, title, description, children }: NewsletterActionCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-0.5">
            <span className="text-3xl font-semibold text-text-primary">devport</span>
            <span className="text-accent text-3xl font-semibold">.</span>
          </Link>
        </div>

        <div className="bg-surface-card rounded-2xl p-8 border border-surface-border">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 ${styles.circle}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={styles.icon} />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-text-primary text-center mb-3">{title}</h1>

          {description && (
            <div className="text-sm text-text-muted text-center leading-relaxed">{description}</div>
          )}

          {children && <div className="mt-8 space-y-3">{children}</div>}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
            ← 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
