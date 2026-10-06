import type { ButtonHTMLAttributes } from 'react';
import type { OAuthProviderMeta } from './oauthProviders';

type OAuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  provider: OAuthProviderMeta;
};

/** Full-width provider button: logo pinned left, label centered, so a stack of them lines up. */
export default function OAuthButton({ provider: { Icon }, children, className = '', ...props }: OAuthButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`relative flex h-11 w-full items-center justify-center rounded-lg border border-surface-border bg-surface-elevated px-12 text-sm font-medium text-text-primary transition-colors hover:border-[#3d444d] hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-surface-border disabled:hover:bg-surface-elevated ${className}`}
    >
      <Icon className="absolute left-4 h-[18px] w-[18px]" />
      {children}
    </button>
  );
}
