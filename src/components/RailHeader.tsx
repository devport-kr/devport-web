import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface RailHeaderProps {
  kicker: ReactNode;
  title: string;
  description?: string;
  moreTo?: string;
  moreLabel?: string;
}

// Header for the right-rail widgets: mono kicker, title, optional "see all" link
export default function RailHeader({ kicker, title, description, moreTo, moreLabel = '전체보기' }: RailHeaderProps) {
  return (
    <div className="mb-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono flex items-center gap-1.5">{kicker}</p>
          <h2 className="mt-1 text-[15px] font-semibold text-text-primary">{title}</h2>
        </div>
        {moreTo && (
          <Link
            to={moreTo}
            className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted hover:text-accent transition-colors"
          >
            {moreLabel} →
          </Link>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
    </div>
  );
}
