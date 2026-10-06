import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  /** Size and text size, e.g. "h-8 w-8 text-sm" */
  className?: string;
}

/** Profile photo that falls back to the name's first letter when there is no image or it fails to load. */
export default function Avatar({ src, name, className = '' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailedSrc(src)}
        className={`shrink-0 rounded-full object-cover bg-surface-elevated ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-indigo-500 font-semibold text-white ${className}`}
    >
      {name?.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
