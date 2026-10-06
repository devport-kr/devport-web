import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const toneStyles = {
  error: { box: 'border-red-500/25 bg-red-500/[0.08] text-red-300', Icon: CircleAlert },
  success: { box: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300', Icon: CircleCheck },
  info: { box: 'border-surface-border bg-surface-card/60 text-text-muted', Icon: Info },
};

interface FormAlertProps {
  tone?: keyof typeof toneStyles;
  children: ReactNode;
  className?: string;
}

/** Banner for messages that belong to the whole form rather than one field. */
export default function FormAlert({ tone = 'error', children, className = '' }: FormAlertProps) {
  const { box, Icon } = toneStyles[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed break-keep ${box} ${className}`}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
