interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-[17px]',
  lg: 'text-2xl',
};

export default function Wordmark({ size = 'md', className = '' }: WordmarkProps) {
  return (
    <span className={`font-mono font-semibold tracking-tight text-text-primary ${sizeClasses[size]} ${className}`}>
      devport<span className="text-accent">.</span>
    </span>
  );
}
