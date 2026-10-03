import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { Eye, EyeOff } from 'lucide-react';
import { initiateOAuthLogin, login, resendVerification } from '../services/auth/authService';
import AuthLayout from '../components/auth/AuthLayout';
import FormAlert from '../components/auth/FormAlert';
import SocialLoginButtons, { type OAuthProvider } from '../components/auth/SocialLoginButtons';
import { useAuth } from '../contexts/AuthContext';

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticate, isAuthenticated } = useAuth();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'oauth' | 'local'>('oauth');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (!error) {
      setErrorMessage(null);
      return;
    }

    if (error === 'auth_failed') {
      setErrorMessage('로그인에 실패했습니다. 다시 시도해주세요.');
    } else if (error === 'turnstile_failed') {
      setErrorMessage('봇 검증에 실패했습니다. 페이지를 새로고침해주세요.');
    } else if (error === 'Bot verification failed') {
      setErrorMessage('봇 검증에 실패했습니다. 다시 시도해주세요.');
    } else if (error === 'Turnstile token is missing') {
      setErrorMessage('봇 검증 토큰이 누락되었습니다. 다시 시도해주세요.');
    } else if (error === 'signup_required') {
      setErrorMessage('계정을 찾을 수 없습니다. 회원가입 페이지에서 약관 동의 후 가입을 진행해주세요.');
    } else {
      setErrorMessage(error);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleOAuthLogin = (provider: OAuthProvider) => {
    if (!turnstileToken) {
      setErrorMessage('보안 확인을 먼저 완료해주세요.');
      return;
    }
    initiateOAuthLogin(provider, turnstileToken);
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setErrorMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('봇 검증을 완료해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setVerificationRequired(false);
    setVerificationMessage(null);

    try {
      const response = await login({
        username: formData.username,
        password: formData.password,
      });

      await authenticate(response.accessToken);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      console.error('Login error:', error);
      if (axiosError.response?.status === 401) {
        setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (axiosError.response?.status === 403) {
        setVerificationRequired(true);
        setVerificationEmail('');
        setErrorMessage('이메일 인증이 완료되어야 로그인할 수 있습니다.');
      } else {
        setErrorMessage('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationEmail.trim()) {
      setVerificationMessage('이메일을 입력해주세요.');
      return;
    }

    setIsResendingVerification(true);
    setVerificationMessage(null);

    try {
      await resendVerification({ email: verificationEmail.trim() });
      setVerificationMessage('계정이 인증 대상이면 인증 메일이 발송됩니다.');
    } catch {
      setVerificationMessage('계정이 인증 대상이면 인증 메일이 발송됩니다.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <AuthLayout
      kicker="Log in"
      title="로그인"
      subtitle="다시 오신 것을 환영합니다."
      footer={
        <div className="space-y-2">
          <p className="text-sm text-text-muted">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-accent hover:text-accent-light font-medium">
              회원가입
            </Link>
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            로그인은 기존 계정 인증만 처리합니다. 약관 동의가 필요한 신규 가입은 회원가입에서 진행해주세요.
          </p>
        </div>
      }
    >
      {/* Error Message */}
      {errorMessage && <FormAlert className="mb-5">{errorMessage}</FormAlert>}

      {verificationRequired && (
        <FormAlert tone="info" className="mb-5">
          <p>인증 메일을 다시 받으려면 이메일 주소를 입력하세요.</p>
          <form onSubmit={handleResendVerification} className="mt-3 flex gap-2">
            <label htmlFor="verification-email" className="sr-only">이메일</label>
            <input
              id="verification-email"
              type="email"
              autoComplete="email"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="email@example.com"
              className="input h-10 flex-1 min-w-0"
            />
            <button type="submit" disabled={isResendingVerification} className="btn btn-secondary">
              {isResendingVerification ? '전송 중' : '재전송'}
            </button>
          </form>
          {verificationMessage && (
            <p className="mt-2 text-text-secondary">{verificationMessage}</p>
          )}
        </FormAlert>
      )}

      {/* Login Mode Tabs */}
      <div className="tabbar w-full mb-6" role="group" aria-label="로그인 방식">
        <button
          type="button"
          aria-pressed={loginMode === 'oauth'}
          onClick={() => setLoginMode('oauth')}
          className="tabbar-item flex-1 py-2.5"
        >
          소셜 로그인
        </button>
        <button
          type="button"
          aria-pressed={loginMode === 'local'}
          onClick={() => setLoginMode('local')}
          className="tabbar-item flex-1 py-2.5"
        >
          이메일 로그인
        </button>
      </div>

      {/* OAuth Login */}
      {loginMode === 'oauth' && (
        <SocialLoginButtons verb="계속하기" onSelect={handleOAuthLogin} />
      )}

      {/* Local Login Form */}
      {loginMode === 'local' && (
        <form onSubmit={handleLocalLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="label-mono block mb-1.5">
              아이디
            </label>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="password" className="label-mono block mb-1.5">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className="input pr-11"
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      )}

      {/* Turnstile */}
      <div className="mt-6">
        <p className="label-mono mb-2">보안 확인</p>
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
      </div>
    </AuthLayout>
  );
}
