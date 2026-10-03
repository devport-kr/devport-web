import { useEffect } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { exchangeOAuthCode } from '../services/auth/authService';
import Wordmark from '../components/Wordmark';

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export default function OAuth2RedirectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticate } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const oauthIntent = sessionStorage.getItem('devport.oauth.intent') as
      | 'login'
      | 'signup'
      | null;

    const redirectToLoginWithError = (message: string) => {
      const target = message
        ? `/login?error=${encodeURIComponent(message)}`
        : '/login?error=auth_failed';
      navigate(target, { replace: true });
    };

    const redirectToSignupWithError = (message: string) => {
      const target = message
        ? `/signup?error=${encodeURIComponent(message)}`
        : '/signup';
      navigate(target, { replace: true });
    };

    if (!code) {
      if (oauthIntent === 'signup') {
        redirectToSignupWithError(error ?? 'auth_failed');
      } else {
        redirectToLoginWithError(error ?? 'auth_failed');
      }
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await exchangeOAuthCode({ code });
        sessionStorage.removeItem('devport.oauth.intent');
        window.history.replaceState({}, document.title, '/oauth2/redirect');
        await authenticate(response.accessToken);
        navigate('/', { replace: true });
      } catch (exchangeError: unknown) {
        const axiosError = exchangeError as AxiosError<ApiErrorPayload>;
        sessionStorage.removeItem('devport.oauth.intent');
        window.history.replaceState({}, document.title, '/oauth2/redirect');
        const message =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          axiosError.message ||
          'auth_failed';

        if (oauthIntent === 'signup') {
          redirectToSignupWithError(message);
          return;
        }

        if (
          typeof message === 'string' &&
          /signup|sign up|register|not found/i.test(message)
        ) {
          redirectToSignupWithError(message);
          return;
        }

        redirectToLoginWithError(message);
      }
    };

    void exchangeCode();
  }, [searchParams, navigate, authenticate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4" role="status">
        <Wordmark size="lg" />
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">로그인 처리 중</p>
        </div>
      </div>
    </div>
  );
}
