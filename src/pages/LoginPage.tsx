import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { initiateOAuthLogin, login } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'oauth' | 'local'>('oauth');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setErrorMessage('로그인에 실패했습니다. 다시 시도해주세요.');
    } else if (error === 'turnstile_failed') {
      setErrorMessage('봇 검증에 실패했습니다. 페이지를 새로고침해주세요.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = () => {
    if (!turnstileToken) {
      alert('봇 검증을 완료해주세요.');
      return;
    }
    initiateOAuthLogin('github', turnstileToken);
  };

  const handleGoogleLogin = () => {
    if (!turnstileToken) {
      alert('봇 검증을 완료해주세요.');
      return;
    }
    initiateOAuthLogin('google', turnstileToken);
  };

  const handleNaverLogin = () => {
    if (!turnstileToken) {
      alert('봇 검증을 완료해주세요.');
      return;
    }
    initiateOAuthLogin('naver', turnstileToken);
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

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Redirect to home
      navigate('/', { replace: true });
      window.location.reload(); // Refresh to update auth context
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
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
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-0.5 mb-3">
            <span className="text-3xl font-semibold text-text-primary">devport</span>
            <span className="text-accent text-3xl font-semibold">.</span>
          </Link>
          <p className="text-sm text-text-muted">개발자를 위한 글로벌 트렌드 포털</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-card rounded-2xl p-8 border border-surface-border">
          <h2 className="text-lg font-medium text-text-primary mb-6 text-center">로그인</h2>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400 text-center">{errorMessage}</p>
            </div>
          )}

          {/* Login Mode Tabs */}
          <div className="flex gap-2 mb-6 bg-surface-elevated rounded-xl p-1">
            <button
              onClick={() => setLoginMode('oauth')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                loginMode === 'oauth'
                  ? 'bg-surface-card text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              소셜 로그인
            </button>
            <button
              onClick={() => setLoginMode('local')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                loginMode === 'local'
                  ? 'bg-surface-card text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              이메일 로그인
            </button>
          </div>

          {/* OAuth Login */}
          {loginMode === 'oauth' && (
            <div className="space-y-3">
              {/* GitHub */}
              <button
                onClick={handleGitHubLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#24292e] hover:bg-[#2f363d] text-white text-sm font-medium rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub로 계속하기
              </button>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors border border-gray-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </button>

              {/* Naver */}
              <button
                onClick={handleNaverLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#03C75A] hover:bg-[#02b350] text-white text-sm font-medium rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                Naver로 계속하기
              </button>
            </div>
          )}

          {/* Local Login Form */}
          {loginMode === 'local' && (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                  아이디
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="아이디를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-5 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? '로그인 중...' : '로그인'}
              </button>
            </form>
          )}

          {/* Turnstile */}
          <div className="mt-6 flex justify-center">
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

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-accent hover:text-accent/80 font-medium">
                회원가입
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-4 text-xs text-text-muted text-center leading-relaxed">
            로그인하면{' '}
            <Link to="/terms" className="text-text-secondary hover:text-text-primary underline">이용약관</Link>
            과{' '}
            <Link to="/privacy" className="text-text-secondary hover:text-text-primary underline">개인정보 처리방침</Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        {/* Back link */}
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
  );
}
