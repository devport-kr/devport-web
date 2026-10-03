import { useEffect, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import LegalDocumentModal from '../components/LegalDocumentModal';
import AuthLayout from '../components/auth/AuthLayout';
import FormAlert from '../components/auth/FormAlert';
import SocialLoginButtons, { type OAuthProvider } from '../components/auth/SocialLoginButtons';
import {
  type LegalDocumentKey,
  CURRENT_TERMS_VERSION,
} from '../content/legalDocuments';
import { useAuth } from '../contexts/AuthContext';
import { initiateOAuthLogin } from '../services/auth/authService';

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    age14: false,
  });
  const [openDocument, setOpenDocument] = useState<LegalDocumentKey | null>(null);

  const hasRequiredAgreements =
    agreements.terms && agreements.privacy && agreements.age14;
  const isAllAgreed = hasRequiredAgreements;
  const isSignupActionDisabled = !turnstileToken || !hasRequiredAgreements;
  const generalError = errors.general ?? searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAgreementChange =
    (key: keyof typeof agreements) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;

      setAgreements((prev) => ({
        ...prev,
        [key]: checked,
      }));

      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.agreements;
        delete nextErrors.general;
        return nextErrors;
      });
    };

  const handleAllAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;

    setAgreements({
      terms: checked,
      privacy: checked,
      age14: checked,
    });

    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.agreements;
      delete nextErrors.general;
      return nextErrors;
    });
  };

  const handleOAuthSignup = (provider: OAuthProvider) => {
    if (!hasRequiredAgreements) {
      setErrors({
        agreements: '필수 약관에 모두 동의해야 회원가입할 수 있습니다.',
      });
      return;
    }

    if (!turnstileToken) {
      setErrors({ general: '봇 검증을 완료해주세요.' });
      return;
    }

    setErrors({});
    initiateOAuthLogin(provider, turnstileToken, 'signup', CURRENT_TERMS_VERSION);
  };

  const agreementItems: { key: keyof typeof agreements; label: string; document?: LegalDocumentKey }[] = [
    { key: 'terms', label: '[필수] 서비스 이용약관 동의', document: 'terms' },
    { key: 'privacy', label: '[필수] 개인정보 수집·이용 동의', document: 'privacy' },
    { key: 'age14', label: '[필수] 만 14세 이상입니다' },
  ];

  return (
    <>
      <AuthLayout
        kicker="Sign up"
        title="회원가입"
        subtitle="약관에 동의하고 보안 확인을 마치면 소셜 계정으로 바로 시작할 수 있습니다."
        footer={
          <p className="text-sm text-text-muted">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-accent hover:text-accent-light font-medium">
              로그인
            </Link>
          </p>
        }
      >
        {generalError && <FormAlert className="mb-5">{generalError}</FormAlert>}

        <ol className="space-y-3">
          {/* Step 1: agreements */}
          <SignupStep index={1} title="약관 동의" done={hasRequiredAgreements}>
            <label className="flex items-center gap-3 pb-3 mb-3 border-b border-surface-border text-sm font-medium text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={isAllAgreed}
                onChange={handleAllAgreementChange}
                className="h-4 w-4 accent-action cursor-pointer"
              />
              모두 동의하기
            </label>

            <ul className="space-y-2.5">
              {agreementItems.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={agreements[item.key]}
                      onChange={handleAgreementChange(item.key)}
                      className="h-4 w-4 shrink-0 accent-action cursor-pointer"
                    />
                    {item.label}
                  </label>
                  {item.document && (
                    <button
                      type="button"
                      onClick={() => setOpenDocument(item.document!)}
                      className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted hover:text-accent transition-colors"
                    >
                      보기
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {errors.agreements && (
              <p className="mt-3 text-sm text-danger" role="alert">{errors.agreements}</p>
            )}
          </SignupStep>

          {/* Step 2: bot verification */}
          <SignupStep index={2} title="보안 확인" done={Boolean(turnstileToken)}>
            <div className="flex justify-center min-h-[65px]">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: 'dark',
                  size: 'normal',
                }}
              />
            </div>
          </SignupStep>

          {/* Step 3: provider */}
          <SignupStep index={3} title="가입 방법 선택" done={false}>
            <SocialLoginButtons
              verb="회원가입"
              onSelect={handleOAuthSignup}
              disabled={isSignupActionDisabled}
            />
            {isSignupActionDisabled && (
              <p className="mt-3 font-mono text-[11px] text-text-muted">
                {!hasRequiredAgreements ? '01 약관 동의' : '02 보안 확인'}을 마치면 선택할 수 있습니다.
              </p>
            )}
          </SignupStep>
        </ol>
      </AuthLayout>

      <LegalDocumentModal
        documentKey={openDocument}
        onClose={() => setOpenDocument(null)}
      />
    </>
  );
}

interface SignupStepProps {
  index: number;
  title: string;
  done: boolean;
  children: ReactNode;
}

function SignupStep({ index, title, done, children }: SignupStepProps) {
  return (
    <li className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-sm flex items-center justify-center font-mono text-[11px] font-semibold ${done ? 'bg-success/15 text-success' : 'bg-surface-hover text-text-muted'
              }`}
          >
            {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" /> : String(index).padStart(2, '0')}
          </span>
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">{title}</h3>
        </div>
        {done && <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-success">완료</span>}
      </div>
      {children}
    </li>
  );
}
