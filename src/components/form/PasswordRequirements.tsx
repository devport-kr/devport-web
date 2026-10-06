import { Check } from 'lucide-react';
import { PASSWORD_SPECIAL_CHAR } from '../../lib/signupValidation';

const requirements = [
  { label: '8~64자', test: (password: string) => password.length >= 8 && password.length <= 64 },
  { label: '특수문자 포함 (!@#$%^&* 등)', test: (password: string) => PASSWORD_SPECIAL_CHAR.test(password) },
];

/** Live checklist of the server's password rules, shown under a new-password field. */
export default function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {requirements.map(({ label, test }) => {
        const isMet = test(password);
        return (
          <li
            key={label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${isMet ? 'text-emerald-400' : 'text-text-muted'}`}
          >
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${
                isMet ? 'bg-emerald-500/15' : 'bg-surface-hover'
              }`}
            >
              {isMet ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : <span className="h-1 w-1 rounded-full bg-text-muted/70" />}
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}
