import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Native checkbox with the dark theme's box and check mark; wrap it in a <label> for its text. */
export default function Checkbox({ className = '', ...props }: CheckboxProps) {
  return (
    <span className={`relative inline-flex h-[18px] w-[18px] shrink-0 ${className}`}>
      <input
        {...props}
        type="checkbox"
        className="peer h-full w-full cursor-pointer appearance-none rounded-[5px] border border-[#3d444d] bg-surface-elevated transition-colors hover:border-text-muted checked:border-accent checked:bg-accent checked:hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      />
      <Check
        aria-hidden
        strokeWidth={3.5}
        className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </span>
  );
}
