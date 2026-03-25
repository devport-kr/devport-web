import { useEffect } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { exchangeOAuthCode } from '../services/auth/authService';

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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-white text-lg">로그인 처리 중...</p>
      </div>
    </div>
  );
}
