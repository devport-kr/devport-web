import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { inputClass } from './formStyles';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  hasError?: boolean;
};

/** Password field with a show/hide toggle. */
export default function PasswordInput({ hasError = false, className = '', ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={`${inputClass(hasError)} pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:text-text-primary"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
