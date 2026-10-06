import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import LegalDocumentModal from '../components/LegalDocumentModal';
import {
  type LegalDocumentKey,
  CURRENT_TERMS_VERSION,
} from '../content/legalDocuments';
import { useAuth } from '../contexts/AuthContext';
import {
  checkUsername,
  initiateOAuthLogin,
  sendSignupEmailCode,
  signup,
  verifySignupEmailCode,
} from '../services/auth/authService';
import { isBotVerificationFailure, parseApiError, type ParsedApiError } from '../lib/http/apiError';
import { validateEmail, validatePassword, validateUsername } from '../lib/signupValidation';

type SignupMode = 'local' | 'oauth';
type FormField = 'username' | 'password' | 'passwordConfirm' | 'email';

const USERNAME_UNAVAILABLE = '이미 사용 중이거나 사용할 수 없는 아이디입니다.';
const EMAIL_REGISTERED = '이미 가입된 이메일입니다.';
const EMAIL_INVALID = '올바른 이메일 주소를 입력해주세요.';
const EMAIL_VERIFICATION_REQUIRED = '이메일 인증을 완료해주세요.';
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

const inputClassName = (hasError: boolean) =>
  `w-full px-4 py-2.5 bg-surface-elevated border ${
    hasError ? 'border-red-500' : 'border-surface-border'
  } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`;

const inlineButtonClassName =
  'shrink-0 whitespace-nowrap px-4 py-2.5 bg-surface-card border border-surface-border hover:border-accent text-text-secondary text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-surface-border';

const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Signup 400s from the email verification check: the token expired, was already used or belongs to another email.
const isEmailVerificationRejected = ({ status, message, validationErrors }: ParsedApiError) =>
  status === 400 && (Boolean(message?.includes('이메일 인증')) || 'emailVerificationToken' in validationErrors);

const getSendCodeErrors = (apiError: ParsedApiError): Record<string, string> => {
  const { status, message, validationErrors } = apiError;

  if (status === 409) {
    return { email: EMAIL_REGISTERED };
  }
  if (status === 400) {
    if (isBotVerificationFailure(apiError)) {
      return { emailSend: '봇 검증에 실패했습니다. 다시 시도해주세요.' };
    }
    if (validationErrors.email) {
      return { email: EMAIL_INVALID };
    }
  }
  // 429 (resend cooldown, hourly or daily limit) and 503 (mail not sent) messages come from the server in Korean.
  if ((status === 429 || status === 503) && message) {
    return { emailSend: message };
  }
  return { emailSend: '인증번호를 보내지 못했습니다. 잠시 후 다시 시도해주세요.' };
};

const getVerifyCodeError = ({ status, message, validationErrors }: ParsedApiError): string => {
  if (status === 400 && validationErrors.code) {
    return '인증번호 6자리를 입력해주세요.';
  }
  // 400 (wrong code, with the remaining tries) and 503 messages come from the server in Korean.
  if ((status === 400 || status === 503) && message) {
    return message;
  }
  return '인증번호를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.';
};

const getSignupErrors = (apiError: ParsedApiError): Record<string, string> => {
  const { status, message, validationErrors } = apiError;

  if (status === 409) {
    // Either the username or the email is taken; only the email conflict message mentions 이메일.
    return message?.includes('이메일') ? { email: EMAIL_REGISTERED } : { username: '이미 사용 중인 아이디입니다.' };
  }
  if (status === 429) {
    return { general: message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
  }
  if (status === 400) {
    if (isEmailVerificationRejected(apiError)) {
      return {
        emailSend: message?.includes('이메일 인증')
          ? message
          : '이메일 인증이 만료되었습니다. 이메일을 다시 인증해주세요.',
      };
    }
    if ('agreedTermsVersion' in validationErrors || /terms version/i.test(message ?? '')) {
      return { general: '약관이 개정되었습니다. 새로고침 후 다시 동의해주세요.' };
    }

    const fieldErrors: Record<string, string> = {};
    if (validationErrors.username) {
      fieldErrors.username = '사용할 수 없는 아이디입니다. (3~20자 영문, 숫자, _, -)';
    }
    if (validationErrors.password) {
      fieldErrors.password = '비밀번호는 8~64자이며 특수문자를 1개 이상 포함해야 합니다.';
    }
    if (validationErrors.email) {
      fieldErrors.email = EMAIL_INVALID;
    }
    if (Object.keys(fieldErrors).length > 0) {
      return fieldErrors;
    }
  }

  return { general: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.' };
};

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticate, isAuthenticated } = useAuth();
  const [signupMode, setSignupMode] = useState<SignupMode>('local');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    email: '',
  });
  // Result of the last availability check; available is null when the check itself failed.
  const [usernameCheck, setUsernameCheck] = useState<{ username: string; available: boolean | null } | null>(null);
  // Email verification: send a code → verify it → keep the token for the signup request.
  const [codeRequest, setCodeRequest] = useState<{ email: string; expiresAt: number } | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  // Clock for the countdowns; only ticks while one is running.
  const [now, setNow] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    age14: false,
  });
  const [openDocument, setOpenDocument] = useState<LegalDocumentKey | null>(null);

  const hasRequiredAgreements =
    agreements.terms && agreements.privacy && agreements.age14;
  const isAllAgreed = hasRequiredAgreements;
  const isOAuthSignupDisabled = !turnstileToken || !hasRequiredAgreements;
  const isLocalSignupDisabled = !emailVerificationToken || !hasRequiredAgreements;
  const generalError = errors.general ?? searchParams.get('error');

  const isEmailVerified = emailVerificationToken !== null;
  const isEmailLocked = isEmailVerified || isSendingCode || isVerifyingCode;
  const isCodeStep = codeRequest !== null && !isEmailVerified;
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  const codeSecondsLeft = codeRequest ? Math.max(0, Math.ceil((codeRequest.expiresAt - now) / 1000)) : 0;
  const isCountingDown = resendSeconds > 0 || (isCodeStep && codeSecondsLeft > 0);
  const canSendCode = !isEmailLocked && Boolean(turnstileToken) && resendSeconds === 0;
  const canVerifyCode =
    isCodeStep && !isVerifyingCode && codeSecondsLeft > 0 && VERIFICATION_CODE_PATTERN.test(verificationCode);

  const isUsernameFormatValid = validateUsername(formData.username) === null;
  const usernameStatus = !isUsernameFormatValid
    ? 'idle'
    : usernameCheck?.username !== formData.username
      ? 'checking'
      : usernameCheck.available === null
        ? 'idle'
        : usernameCheck.available
          ? 'available'
          : 'unavailable';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Debounced availability check once the username matches the format rules.
  useEffect(() => {
    const username = formData.username;
    if (validateUsername(username) !== null) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      let available: boolean | null = null;
      try {
        available = await checkUsername(username);
      } catch (error) {
        console.error('Username check error:', error);
      }
      if (!cancelled) {
        setUsernameCheck({ username, available });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.username]);

  useEffect(() => {
    if (!isCountingDown) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isCountingDown]);

  const resetTurnstile = () => {
    turnstileRef.current?.reset();
    setTurnstileToken(null);
  };

  const clearErrors = (...keys: string[]) => {
    setErrors((prev) => {
      const nextErrors = { ...prev };
      keys.forEach((key) => delete nextErrors[key]);
      return nextErrors;
    });
  };

  const handleAgreementChange =
    (key: keyof typeof agreements) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;

      setAgreements((prev) => ({
        ...prev,
        [key]: checked,
      }));

      clearErrors('agreements', 'general');
    };

  const handleAllAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;

    setAgreements({
      terms: checked,
      privacy: checked,
      age14: checked,
    });

    clearErrors('agreements', 'general');
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as FormField;
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'email') {
      // A code that was already sent belongs to the previous address.
      setCodeRequest(null);
      setResendAvailableAt(0);
      setVerificationCode('');
      clearErrors(name, 'emailSend', 'code', 'general');
      return;
    }
    clearErrors(name, 'general');
  };

  const getFieldError = (field: FormField, data = formData): string | null => {
    if (field === 'username') return validateUsername(data.username);
    if (field === 'password') return validatePassword(data.password);
    if (field === 'email') return validateEmail(data.email.trim());
    if (!data.passwordConfirm) return '비밀번호를 한 번 더 입력해주세요.';
    return data.password === data.passwordConfirm ? null : '비밀번호가 일치하지 않습니다.';
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as FormField;
    if (!formData[name]) return;

    const fieldError = getFieldError(name);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
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

  const handleSendCode = async () => {
    const email = formData.email.trim();
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }
    if (!turnstileToken) {
      setErrors((prev) => ({ ...prev, emailSend: '봇 검증을 완료해주세요.' }));
      return;
    }

    setIsSendingCode(true);
    clearErrors('email', 'emailSend', 'code', 'general');

    try {
      const { expiresIn, resendAvailableIn } = await sendSignupEmailCode({ email, turnstileToken });
      const sentAt = Date.now();
      setNow(sentAt);
      setCodeRequest({ email, expiresAt: sentAt + expiresIn * 1000 });
      setResendAvailableAt(sentAt + resendAvailableIn * 1000);
      setVerificationCode('');
    } catch (error: unknown) {
      console.error('Signup email code error:', error);
      setErrors((prev) => ({ ...prev, ...getSendCodeErrors(parseApiError(error)) }));
    } finally {
      // Turnstile tokens are single-use: get a fresh one for the next attempt, even after a failure.
      resetTurnstile();
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!codeRequest || !canVerifyCode) return;

    setIsVerifyingCode(true);
    clearErrors('code', 'emailSend', 'general');

    try {
      const { verificationToken } = await verifySignupEmailCode({
        email: codeRequest.email,
        code: verificationCode,
      });
      setEmailVerificationToken(verificationToken);
      setCodeRequest(null);
      setVerificationCode('');
    } catch (error: unknown) {
      console.error('Signup email verify error:', error);
      const apiError = parseApiError(error);
      const { message } = apiError;
      if (apiError.status === 400 && message?.includes('다시 요청')) {
        // The code expired or ran out of tries and is gone on the server: back to the send step.
        setCodeRequest(null);
        setVerificationCode('');
        setErrors((prev) => ({ ...prev, emailSend: message }));
      } else {
        setErrors((prev) => ({ ...prev, code: getVerifyCodeError(apiError) }));
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
    clearErrors('code');
  };

  // Enter in the email or code field runs that step instead of submitting the whole form.
  const handleStepKeyDown = (action: () => void, enabled: boolean) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (enabled) action();
  };

  const handleChangeEmail = () => {
    setEmailVerificationToken(null);
    clearErrors('email', 'emailSend', 'code');
  };

  const handleLocalSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    (['username', 'password', 'passwordConfirm', 'email'] as const).forEach((field) => {
      const fieldError = getFieldError(field);
      if (fieldError) nextErrors[field] = fieldError;
    });
    if (!nextErrors.username && usernameStatus === 'unavailable') {
      nextErrors.username = USERNAME_UNAVAILABLE;
    }
    if (!nextErrors.email && !emailVerificationToken) {
      nextErrors.emailSend = EMAIL_VERIFICATION_REQUIRED;
    }
    if (!hasRequiredAgreements) {
      nextErrors.agreements = '필수 약관에 모두 동의해야 회원가입할 수 있습니다.';
    }
    if (Object.keys(nextErrors).length > 0 || !emailVerificationToken) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { accessToken } = await signup({
        username: formData.username,
        password: formData.password,
        email: formData.email.trim(),
        emailVerificationToken,
        agreedTermsVersion: CURRENT_TERMS_VERSION,
      });

      await authenticate(accessToken);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const apiError = parseApiError(error);
      const signupErrors = getSignupErrors(apiError);
      if (signupErrors.email === EMAIL_REGISTERED || isEmailVerificationRejected(apiError)) {
        // The token can't be used for this email any more: unlock the field and verify again.
        setEmailVerificationToken(null);
      } else if (apiError.status === 409) {
        // A failed signup doesn't use up the token, so the user can pick another username and resubmit.
        setUsernameCheck({ username: formData.username, available: false });
      }
      setErrors(signupErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUsernameMessage = () => {
    if (errors.username) {
      return <p className="mt-1.5 text-sm text-red-400">{errors.username}</p>;
    }
    if (usernameStatus === 'checking') {
      return <p className="mt-1.5 text-xs text-text-muted">아이디 확인 중...</p>;
    }
    if (usernameStatus === 'available') {
      return <p className="mt-1.5 text-sm text-green-400">사용 가능한 아이디입니다</p>;
    }
    if (usernameStatus === 'unavailable') {
      return <p className="mt-1.5 text-sm text-red-400">이미 사용 중이거나 사용할 수 없는 아이디입니다</p>;
    }
    return <p className="mt-1.5 text-xs text-text-muted">3~20자 영문, 숫자, _, -</p>;
  };

  const renderEmailMessage = () => {
    const emailError = errors.email ?? errors.emailSend;
    if (emailError) {
      return (
        <p className="mt-1.5 text-sm text-red-400">
          {emailError}
          {errors.email === EMAIL_REGISTERED && (
            <>
              {' '}
              <Link to="/login" className="font-medium text-accent hover:text-accent/80">
                로그인하기
              </Link>
            </>
          )}
        </p>
      );
    }
    if (isEmailVerified) {
      return <p className="mt-1.5 text-sm text-green-400">이메일 인증이 완료되었습니다</p>;
    }
    if (isCodeStep) {
      return null;
    }
    if (!turnstileToken) {
      return <p className="mt-1.5 text-xs text-text-muted break-keep">아래 봇 검증이 끝나면 인증번호를 받을 수 있습니다</p>;
    }
    return <p className="mt-1.5 text-xs text-text-muted break-keep">입력한 이메일로 인증번호 6자리를 보내드립니다</p>;
  };

  const renderCodeMessage = () => {
    if (errors.code) {
      return <p className="mt-1.5 text-sm text-red-400">{errors.code}</p>;
    }
    if (codeSecondsLeft === 0) {
      return <p className="mt-1.5 text-sm text-red-400">인증번호가 만료되었습니다. 인증번호를 다시 요청해주세요.</p>;
    }
    return (
      <p className="mt-1.5 text-xs text-text-muted break-keep">
        {codeRequest?.email}(으)로 보낸 인증번호를 입력해주세요 · 남은 시간 {formatCountdown(codeSecondsLeft)}
      </p>
    );
  };

  const getSendCodeLabel = () => {
    if (isSendingCode) return '발송 중...';
    if (resendSeconds > 0) return `재발송 (${resendSeconds}초)`;
    return codeRequest ? '재발송' : '인증번호 받기';
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-0.5 mb-3">
              <span className="text-3xl font-semibold text-text-primary">devport</span>
              <span className="text-accent text-3xl font-semibold">.</span>
            </Link>
            <p className="text-sm text-text-muted">개발자를 위한 글로벌 트렌드 포털</p>
          </div>

          <div className="min-h-[42rem] rounded-2xl border border-surface-border bg-surface-card p-8">
            <h2 className="text-lg font-medium text-text-primary mb-6 text-center">회원가입</h2>
            {generalError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400 text-center">{generalError}</p>
              </div>
            )}

            {/* Signup Mode Tabs */}
            <div className="flex gap-2 mb-6 bg-surface-elevated rounded-xl p-1">
              <button
                type="button"
                onClick={() => setSignupMode('local')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  signupMode === 'local'
                    ? 'bg-surface-card text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                아이디로 가입
              </button>
              <button
                type="button"
                onClick={() => setSignupMode('oauth')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  signupMode === 'oauth'
                    ? 'bg-surface-card text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                소셜 계정으로 가입
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-surface-border bg-surface-elevated/40 p-5">
              {/* ID/PW Signup Form (submitted by the button below the Turnstile widget) */}
              {signupMode === 'local' && (
                <form id="local-signup-form" onSubmit={handleLocalSignup} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                      아이디
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleFieldChange}
                      onBlur={handleFieldBlur}
                      autoComplete="username"
                      maxLength={20}
                      className={inputClassName(Boolean(errors.username) || usernameStatus === 'unavailable')}
                      placeholder="아이디를 입력하세요"
                    />
                    {renderUsernameMessage()}
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
                      onChange={handleFieldChange}
                      onBlur={handleFieldBlur}
                      autoComplete="new-password"
                      maxLength={64}
                      className={inputClassName(Boolean(errors.password))}
                      placeholder="비밀번호를 입력하세요"
                    />
                    {errors.password ? (
                      <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-text-muted">8~64자, 특수문자(!@#$%^&* 등) 1개 이상 포함</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-text-secondary mb-2">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      id="passwordConfirm"
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleFieldChange}
                      onBlur={handleFieldBlur}
                      autoComplete="new-password"
                      maxLength={64}
                      className={inputClassName(Boolean(errors.passwordConfirm))}
                      placeholder="비밀번호를 다시 입력하세요"
                    />
                    {errors.passwordConfirm && (
                      <p className="mt-1.5 text-sm text-red-400">{errors.passwordConfirm}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                      이메일
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFieldChange}
                        onBlur={handleFieldBlur}
                        onKeyDown={handleStepKeyDown(handleSendCode, canSendCode)}
                        readOnly={isEmailLocked}
                        autoComplete="email"
                        maxLength={100}
                        className={`${inputClassName(Boolean(errors.email))} min-w-0 ${isEmailLocked ? 'text-text-muted' : ''}`}
                        placeholder="이메일을 입력하세요"
                      />
                      {isEmailVerified ? (
                        <button type="button" onClick={handleChangeEmail} className={inlineButtonClassName}>
                          변경
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={!canSendCode}
                          className={inlineButtonClassName}
                        >
                          {getSendCodeLabel()}
                        </button>
                      )}
                    </div>
                    {renderEmailMessage()}
                  </div>

                  {isCodeStep && (
                    <div>
                      <label htmlFor="verificationCode" className="block text-sm font-medium text-text-secondary mb-2">
                        인증번호
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          id="verificationCode"
                          name="verificationCode"
                          value={verificationCode}
                          onChange={handleCodeChange}
                          onKeyDown={handleStepKeyDown(handleVerifyCode, canVerifyCode)}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          autoFocus
                          className={`${inputClassName(Boolean(errors.code))} min-w-0 tracking-widest`}
                          placeholder="6자리 숫자"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={!canVerifyCode}
                          className={inlineButtonClassName}
                        >
                          {isVerifyingCode ? '확인 중...' : '확인'}
                        </button>
                      </div>
                      {renderCodeMessage()}
                    </div>
                  )}
                </form>
              )}

              {/* OAuth Signup */}
              {signupMode === 'oauth' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthSignup('github')}
                    disabled={isOAuthSignupDisabled}
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
                    disabled={isOAuthSignupDisabled}
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
                    disabled={isOAuthSignupDisabled}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#03C75A] hover:bg-[#02b350] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                    </svg>
                    Naver로 회원가입
                  </button>
                </div>
              )}
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

            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
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

            {signupMode === 'local' && (
              <button
                type="submit"
                form="local-signup-form"
                disabled={isLocalSignupDisabled || isSubmitting}
                className="w-full mt-6 px-5 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '가입 중...' : '가입하기'}
              </button>
            )}

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
