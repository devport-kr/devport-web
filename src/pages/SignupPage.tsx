import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { signup, checkUsernameAvailability, checkEmailAvailability } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time validation states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = '아이디를 입력해주세요.';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = '아이디는 3-20자 사이여야 합니다.';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = '아이디는 영문, 숫자, -, _만 사용 가능합니다.';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = '비밀번호는 최소 1개의 특수문자를 포함해야 합니다.';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!turnstileToken) {
      setErrors({ general: '봇 검증을 완료해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await signup({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        name: formData.name || undefined,
      });

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Redirect to home
      navigate('/', { replace: true });
      window.location.reload(); // Refresh to update auth context
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.response?.status === 409) {
        const message = error.response?.data?.message || '';
        if (message.includes('username')) {
          setErrors({ username: '이미 사용 중인 아이디입니다.' });
        } else if (message.includes('email')) {
          setErrors({ email: '이미 사용 중인 이메일입니다.' });
        } else {
          setErrors({ general: '이미 등록된 정보입니다.' });
        }
      } else {
        setErrors({ general: '회원가입에 실패했습니다. 다시 시도해주세요.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Real-time username validation
    if (name === 'username') {
      setUsernameStatus('idle');
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }

      // Only check if username is valid format
      if (value.length >= 3 && value.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(value)) {
        setUsernameStatus('checking');
        usernameTimeoutRef.current = setTimeout(async () => {
          try {
            const available = await checkUsernameAvailability(value);
            setUsernameStatus(available ? 'available' : 'taken');
          } catch (error) {
            setUsernameStatus('taken');
          }
        }, 500); // 500ms debounce
      }
    }

    // Real-time email validation
    if (name === 'email') {
      setEmailStatus('idle');
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }

      // Only check if email is valid format
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailStatus('checking');
        emailTimeoutRef.current = setTimeout(async () => {
          try {
            const available = await checkEmailAvailability(value);
            setEmailStatus(available ? 'available' : 'taken');
          } catch (error) {
            setEmailStatus('taken');
          }
        }, 500); // 500ms debounce
      }
    }

    // Real-time password validation
    if (name === 'password') {
      setPasswordValidation((prev) => ({
        ...prev,
        minLength: value.length >= 8,
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        passwordsMatch: value === formData.confirmPassword && value.length > 0,
      }));
    }

    // Real-time confirm password validation
    if (name === 'confirmPassword') {
      setPasswordValidation((prev) => ({
        ...prev,
        passwordsMatch: value === formData.password && value.length > 0,
      }));
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-0.5 mb-3">
            <span className="text-3xl font-semibold text-text-primary">devport</span>
            <span className="text-accent text-3xl font-semibold">.</span>
          </Link>
          <p className="text-sm text-text-muted">개발자를 위한 글로벌 트렌드 포털</p>
        </div>

        {/* Signup Card */}
        <div className="bg-surface-card rounded-2xl p-8 border border-surface-border">
          <h2 className="text-lg font-medium text-text-primary mb-6 text-center">회원가입</h2>

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400 text-center">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                아이디 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-12 bg-surface-elevated border ${
                    errors.username
                      ? 'border-red-500'
                      : usernameStatus === 'available'
                      ? 'border-green-500'
                      : usernameStatus === 'taken'
                      ? 'border-red-500'
                      : 'border-surface-border'
                  } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                  placeholder="영문, 숫자, -, _ 사용 (3-20자)"
                />
                {/* Status Icon */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <div className="w-5 h-5 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {usernameStatus === 'taken' && (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
              {errors.username && (
                <p className="mt-1.5 text-sm text-red-400">{errors.username}</p>
              )}
              {!errors.username && usernameStatus === 'available' && (
                <p className="mt-1.5 text-sm text-green-400">사용 가능한 아이디입니다.</p>
              )}
              {!errors.username && usernameStatus === 'taken' && (
                <p className="mt-1.5 text-sm text-red-400">이미 사용 중인 아이디입니다.</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                비밀번호 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-surface-elevated border ${
                  errors.password
                    ? 'border-red-500'
                    : formData.password && passwordValidation.minLength && passwordValidation.hasSpecialChar
                    ? 'border-green-500'
                    : 'border-surface-border'
                } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                placeholder="최소 8자, 특수문자 1개 이상"
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
              {/* Password Requirements */}
              {formData.password && !errors.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {passwordValidation.minLength ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={passwordValidation.minLength ? 'text-green-400' : 'text-text-muted'}>
                      최소 8자 이상
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordValidation.hasSpecialChar ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-text-muted'}>
                      특수문자 1개 이상 (!@#$%^&* 등)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-12 bg-surface-elevated border ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : passwordValidation.passwordsMatch && formData.confirmPassword
                      ? 'border-green-500'
                      : 'border-surface-border'
                  } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                  placeholder="비밀번호를 다시 입력하세요"
                />
                {/* Password Match Icon */}
                {formData.confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {passwordValidation.passwordsMatch ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
              {!errors.confirmPassword && formData.confirmPassword && passwordValidation.passwordsMatch && (
                <p className="mt-1.5 text-sm text-green-400">비밀번호가 일치합니다.</p>
              )}
              {!errors.confirmPassword && formData.confirmPassword && !passwordValidation.passwordsMatch && (
                <p className="mt-1.5 text-sm text-red-400">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                이메일 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-12 bg-surface-elevated border ${
                    errors.email
                      ? 'border-red-500'
                      : emailStatus === 'available'
                      ? 'border-green-500'
                      : emailStatus === 'taken'
                      ? 'border-red-500'
                      : 'border-surface-border'
                  } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                  placeholder="email@example.com"
                />
                {/* Status Icon */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {emailStatus === 'checking' && (
                    <div className="w-5 h-5 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                  )}
                  {emailStatus === 'available' && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {emailStatus === 'taken' && (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
              {!errors.email && emailStatus === 'available' && (
                <p className="mt-1.5 text-sm text-green-400">사용 가능한 이메일입니다.</p>
              )}
              {!errors.email && emailStatus === 'taken' && (
                <p className="mt-1.5 text-sm text-red-400">이미 사용 중인 이메일입니다.</p>
              )}
            </div>

            {/* Name (Optional) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                이름 (선택사항)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                placeholder="표시될 이름"
              />
            </div>

            {/* Turnstile */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-5 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? '처리 중...' : '가입하기'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                로그인
              </Link>
            </p>
          </div>
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
