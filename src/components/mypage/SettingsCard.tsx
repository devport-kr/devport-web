import type { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description?: ReactNode;
  /** Top-right slot, e.g. a status badge */
  aside?: ReactNode;
  children: ReactNode;
  /** Action bar under the body; put a message first with mr-auto to keep buttons on the right */
  footer?: ReactNode;
}

/** Settings section card: title and description, body, and an optional action footer. */
export default function SettingsCard({ title, description, aside, children, footer }: SettingsCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-surface-border bg-surface-card/60">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
            {description && <p className="mt-1 text-[13px] leading-relaxed text-text-muted break-keep">{description}</p>}
          </div>
          {aside}
        </div>
        <div className="mt-5">{children}</div>
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t border-surface-border bg-white/[0.015] px-5 py-3 sm:px-6">
          {footer}
        </div>
      )}
    </section>
  );
}
