// Shared look for the account forms (login, signup, my page settings, newsletter):
// darker inputs with a soft accent focus ring, and one button scale for every action

export const labelClass = 'block text-[13px] font-medium text-text-secondary mb-1.5';

export const helperTextClass = 'mt-1.5 text-xs leading-relaxed text-text-muted break-keep';

export const errorTextClass = 'mt-1.5 text-[13px] leading-relaxed text-red-400 break-keep';

export const successTextClass = 'mt-1.5 text-[13px] leading-relaxed text-emerald-400 break-keep';

// 16px text on phones keeps iOS from zooming into the field
export const inputClass = (hasError = false) =>
  `w-full h-11 px-3.5 rounded-lg border bg-surface-elevated text-base sm:text-sm text-text-primary placeholder:text-text-muted/70 transition-[border-color,box-shadow] focus:outline-none focus:ring-4 read-only:text-text-muted disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/15'
      : 'border-surface-border hover:border-[#3d444d] focus:border-accent focus:ring-accent/15'
  }`;

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'md' | 'sm';

const buttonSizes: Record<ButtonSize, string> = {
  md: 'h-11 px-5',
  sm: 'h-9 px-3.5',
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110 disabled:hover:brightness-100',
  secondary:
    'border border-surface-border bg-surface-elevated text-text-primary hover:border-[#3d444d] hover:bg-surface-hover disabled:hover:border-surface-border disabled:hover:bg-surface-elevated',
  danger: 'text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:hover:bg-transparent',
};

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') =>
  `inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${buttonSizes[size]} ${buttonVariants[variant]}`;
