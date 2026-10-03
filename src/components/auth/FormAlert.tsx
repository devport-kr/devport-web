import type { ReactNode } from 'react';
import { CircleAlert, Info } from 'lucide-react';

interface FormAlertProps {
  tone?: 'error' | 'info';
  children: ReactNode;
  className?: string;
}

export default function FormAlert({ tone = 'error', children, className = '' }: FormAlertProps) {
  const isError = tone === 'error';
  const Icon = isError ? CircleAlert : Info;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex gap-2.5 p-3.5 rounded border text-sm leading-relaxed ${isError
        ? 'border-danger/30 bg-danger/10 text-danger'
        : 'border-accent/30 bg-accent/10 text-text-secondary'
        } ${className}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
