import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import LegalDocumentModal from '../components/LegalDocumentModal';
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

  const handleOAuthSignup = (provider: 'github' | 'google' | 'naver') => {
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

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-0.5 mb-3">
              <span className="text-3xl font-semibold text-text-primary">devport</span>
              <span className="text-accent text-3xl font-semibold">.</span>
            </Link>
            <p className="text-sm text-text-muted">개발자를 위한 글로벌 트렌드 포털</p>
          </div>

          <div className="bg-surface-card rounded-2xl p-8 border border-surface-border">
            <h2 className="text-lg font-medium text-text-primary mb-6 text-center">회원가입</h2>
            <p className="mb-6 text-center text-sm leading-relaxed text-text-muted">
              기존 계정 로그인은{' '}
              <Link to="/login" className="text-accent hover:text-accent/80">
                로그인 페이지
              </Link>
              에서 진행하고, 신규 가입은 소셜 계정으로만 가능합니다.
            </p>

            {generalError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400 text-center">{generalError}</p>
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-surface-border bg-surface-elevated/40 p-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-text-primary">소셜 회원가입</p>
                <p className="mt-1 text-sm text-text-muted">
                  GitHub, Google, Naver 계정으로만 가입할 수 있습니다.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSignup('github')}
                  disabled={isSignupActionDisabled}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#24292e] hover:bg-[#2f363d] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub로 회원가입
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthSignup('google')}
                  disabled={isSignupActionDisabled}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google로 회원가입
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthSignup('naver')}
                  disabled={isSignupActionDisabled}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#03C75A] hover:bg-[#02b350] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                  </svg>
                  Naver로 회원가입
                </button>
              </div>

              <div className="flex justify-center pt-2">
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
            </div>

            <div className="mb-6 rounded-2xl border border-surface-border bg-surface-elevated/60 p-5">
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 border-b border-surface-border pb-3 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={handleAllAgreementChange}
                    className="mt-1 h-4 w-4 rounded border-surface-border bg-surface-card text-accent focus:ring-accent"
                  />
                  <span className="font-medium">모두 동의하기</span>
                </label>

                <label className="flex items-start gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={handleAgreementChange('terms')}
                    className="mt-1 h-4 w-4 rounded border-surface-border bg-surface-card text-accent focus:ring-accent"
                  />
                  <span>
                    [필수] 서비스 이용약관 동의{' '}
                    <button
                      type="button"
                      onClick={() => setOpenDocument('terms')}
                      className="text-accent underline underline-offset-2 hover:text-accent/80"
                    >
                      보기
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={handleAgreementChange('privacy')}
                    className="mt-1 h-4 w-4 rounded border-surface-border bg-surface-card text-accent focus:ring-accent"
                  />
                  <span>
                    [필수] 개인정보 수집·이용 동의{' '}
                    <button
                      type="button"
                      onClick={() => setOpenDocument('privacy')}
                      className="text-accent underline underline-offset-2 hover:text-accent/80"
                    >
                      보기
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={agreements.age14}
                    onChange={handleAgreementChange('age14')}
                    className="mt-1 h-4 w-4 rounded border-surface-border bg-surface-card text-accent focus:ring-accent"
                  />
                  <span>[필수] 만 14세 이상입니다</span>
                </label>
              </div>

              {errors.agreements && (
                <p className="mt-3 text-sm text-red-400">{errors.agreements}</p>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                  로그인
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              ← 홈으로
            </Link>
          </div>
        </div>
      </div>

      <LegalDocumentModal
        documentKey={openDocument}
        onClose={() => setOpenDocument(null)}
      />
    </>
  );
}
