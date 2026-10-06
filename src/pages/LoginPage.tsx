import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { LoaderCircle } from 'lucide-react';
import { initiateOAuthLogin, login } from '../services/auth/authService';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout, { AuthDivider } from '../components/auth/AuthLayout';
import OAuthButton from '../components/auth/OAuthButton';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../components/auth/oauthProviders';
import FormAlert from '../components/form/FormAlert';
import PasswordInput from '../components/form/PasswordInput';
import { buttonClass, inputClass, labelClass } from '../components/form/formStyles';

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
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setErrorMessage('봇 검증을 완료해주세요.');
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

  return (
    <AuthLayout
      title="로그인"
      description="devport 계정으로 로그인하고 저장한 아티클과 읽은 기록을 이어서 확인하세요."
      footer={
        <>
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-medium text-accent-light hover:underline underline-offset-4">
            회원가입
          </Link>
        </>
      }
    >
      {errorMessage && <FormAlert className="mb-6">{errorMessage}</FormAlert>}

      <div className="space-y-2.5">
        {OAUTH_PROVIDERS.map((provider) => (
          <OAuthButton key={provider.id} provider={provider} onClick={() => handleOAuthLogin(provider.id)}>
            {provider.label}로 계속하기
          </OAuthButton>
        ))}
      </div>

      <AuthDivider>또는 아이디로 로그인</AuthDivider>

      <form onSubmit={handleLocalLogin} noValidate className="space-y-4">
        <div>
          <label htmlFor="username" className={labelClass}>
            아이디
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            className={inputClass()}
            placeholder="아이디를 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        {/* Also guards the social buttons above; reserves its height so the button doesn't jump */}
        <div className="min-h-[65px] pt-1">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{
              theme: 'dark',
              size: 'flexible',
            }}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className={`${buttonClass()} w-full`}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
