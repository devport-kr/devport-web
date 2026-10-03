import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface RailHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  moreTo?: string;
  moreLabel?: string;
}

// Header for the right-rail widgets: icon, title, optional "see all" link
export default function RailHeader({ icon, title, description, moreTo, moreLabel = '전체보기' }: RailHeaderProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 min-w-0 text-[15px] font-semibold text-text-primary">
          {icon}
          {title}
        </h2>
        {moreTo && (
          <Link
            to={moreTo}
            className="shrink-0 font-mono text-[11px] text-text-muted hover:text-accent transition-colors"
          >
            {moreLabel} →
          </Link>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
    </div>
  );
}
