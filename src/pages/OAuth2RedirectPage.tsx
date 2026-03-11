import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { exchangeOAuthCode } from '../services/auth/authService';

export default function OAuth2RedirectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticate } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/login?error=auth_failed', { replace: true });
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await exchangeOAuthCode({ code });
        window.history.replaceState({}, document.title, '/oauth2/redirect');
        await authenticate(response.accessToken);
        navigate('/', { replace: true });
      } catch {
        window.history.replaceState({}, document.title, '/oauth2/redirect');
        navigate('/login?error=auth_failed', { replace: true });
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
