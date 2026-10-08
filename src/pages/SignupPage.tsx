import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Check, ChevronRight, Clock, LoaderCircle, X } from 'lucide-react';
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
import AuthLayout from '../components/auth/AuthLayout';
import OAuthButton from '../components/auth/OAuthButton';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../components/auth/oauthProviders';
import Checkbox from '../components/form/Checkbox';
import FormAlert from '../components/form/FormAlert';
import PasswordInput from '../components/form/PasswordInput';
import PasswordRequirements from '../components/form/PasswordRequirements';
import {
  buttonClass,
  errorTextClass,
  helperTextClass,
  inputClass,
  labelClass,
  successTextClass,
} from '../components/form/formStyles';
import { usePageMeta } from '../lib/seo';

type SignupMode = 'local' | 'oauth';
type FormField = 'username' | 'password' | 'passwordConfirm' | 'email';

const USERNAME_UNAVAILABLE = '이미 사용 중이거나 사용할 수 없는 아이디입니다.';
const EMAIL_REGISTERED = '이미 가입된 이메일입니다.';
const EMAIL_INVALID = '올바른 이메일 주소를 입력해주세요.';
const EMAIL_VERIFICATION_REQUIRED = '이메일 인증을 완료해주세요.';
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

const AGREEMENT_ITEMS: { key: 'terms' | 'privacy' | 'age14'; label: string; document?: LegalDocumentKey }[] = [
  { key: 'terms', label: '서비스 이용약관 동의', document: 'terms' },
  { key: 'privacy', label: '개인정보 수집·이용 동의', document: 'privacy' },
  { key: 'age14', label: '만 14세 이상입니다' },
];

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
  usePageMeta({ title: '회원가입', noindex: true });
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
      return <p className={errorTextClass}>{errors.username}</p>;
    }
    if (usernameStatus === 'available') {
      return <p className={successTextClass}>사용 가능한 아이디입니다</p>;
    }
    if (usernameStatus === 'unavailable') {
      return <p className={errorTextClass}>이미 사용 중이거나 사용할 수 없는 아이디입니다</p>;
    }
    return <p className={helperTextClass}>3~20자 영문, 숫자, _, -</p>;
  };

  const renderUsernameStatusIcon = () => {
    if (errors.username) return null;
    if (usernameStatus === 'checking') {
      return <LoaderCircle aria-label="아이디 확인 중" className="h-4 w-4 animate-spin text-text-muted" />;
    }
    if (usernameStatus === 'available') return <Check aria-hidden className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />;
    if (usernameStatus === 'unavailable') return <X aria-hidden className="h-4 w-4 text-red-400" strokeWidth={2.5} />;
    return null;
  };

  const renderEmailMessage = () => {
    const emailError = errors.email ?? errors.emailSend;
    if (emailError) {
      return (
        <p className={errorTextClass}>
          {emailError}
          {errors.email === EMAIL_REGISTERED && (
            <>
              {' '}
              <Link to="/login" className="font-medium text-accent-light underline-offset-4 hover:underline">
                로그인하기
              </Link>
            </>
          )}
        </p>
      );
    }
    if (isEmailVerified) {
      return <p className={successTextClass}>이메일 인증이 완료되었습니다</p>;
    }
    if (isCodeStep) {
      return null;
    }
    if (!turnstileToken) {
      return <p className={helperTextClass}>아래 봇 검증이 끝나면 인증번호를 받을 수 있습니다</p>;
    }
    return <p className={helperTextClass}>입력한 이메일로 인증번호 6자리를 보내드립니다</p>;
  };

  const renderCodeMessage = () => {
    if (errors.code) {
      return <p className={errorTextClass}>{errors.code}</p>;
    }
    if (codeSecondsLeft === 0) {
      return <p className={errorTextClass}>인증번호가 만료되었습니다. 인증번호를 다시 요청해주세요.</p>;
    }
    return (
      <p className={helperTextClass}>
        <span className="text-text-secondary">{codeRequest?.email}</span>(으)로 보낸 인증번호를 입력해주세요
      </p>
    );
  };

  const getSendCodeLabel = () => {
    if (isSendingCode) return '발송 중...';
    if (resendSeconds > 0) return `재발송 (${resendSeconds}초)`;
    return codeRequest ? '재발송' : '인증번호 받기';
  };

  const isPasswordConfirmed =
    Boolean(formData.passwordConfirm) && formData.password === formData.passwordConfirm && !errors.passwordConfirm;

  return (
    <>
      <AuthLayout
        title="계정 만들기"
        description="무료로 가입하고 아티클 저장, 읽은 기록, 뉴스레터를 이용해보세요."
        footer={
          <>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-medium text-accent-light underline-offset-4 hover:underline">
              로그인
            </Link>
          </>
        }
      >
        {generalError && <FormAlert className="mb-6">{generalError}</FormAlert>}

        {/* Signup Mode Tabs */}
        <div role="tablist" aria-label="가입 방법" className="grid grid-cols-2 gap-1 rounded-lg border border-surface-border bg-surface-elevated p-1">
          {(
            [
              ['local', '아이디로 가입'],
              ['oauth', '소셜 계정으로 가입'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={signupMode === mode}
              onClick={() => setSignupMode(mode)}
              className={`h-9 rounded-md text-sm font-medium transition-colors ${
                signupMode === mode
                  ? 'bg-surface-hover text-text-primary shadow-soft'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ID/PW Signup Form (submitted by the button below the Turnstile widget) */}
        {signupMode === 'local' && (
          <form id="local-signup-form" onSubmit={handleLocalSignup} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="username" className={labelClass}>
                아이디
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  autoComplete="username"
                  maxLength={20}
                  className={`${inputClass(Boolean(errors.username) || usernameStatus === 'unavailable')} pr-10`}
                  placeholder="영문, 숫자로 된 아이디"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                  {renderUsernameStatusIcon()}
                </span>
              </div>
              {renderUsernameMessage()}
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                비밀번호
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                autoComplete="new-password"
                maxLength={64}
                hasError={Boolean(errors.password)}
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password ? (
                <p className={errorTextClass}>{errors.password}</p>
              ) : (
                <PasswordRequirements password={formData.password} />
              )}
            </div>

            <div>
              <label htmlFor="passwordConfirm" className={labelClass}>
                비밀번호 확인
              </label>
              <PasswordInput
                id="passwordConfirm"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                autoComplete="new-password"
                maxLength={64}
                hasError={Boolean(errors.passwordConfirm)}
                placeholder="비밀번호를 한 번 더 입력하세요"
              />
              {errors.passwordConfirm ? (
                <p className={errorTextClass}>{errors.passwordConfirm}</p>
              ) : (
                isPasswordConfirmed && <p className={successTextClass}>비밀번호가 일치합니다</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                이메일
              </label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
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
                    className={`${inputClass(Boolean(errors.email))} ${isEmailVerified ? 'pr-10' : ''}`}
                    placeholder="you@example.com"
                  />
                  {isEmailVerified && (
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                      <Check aria-hidden className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
                    </span>
                  )}
                </div>
                {isEmailVerified ? (
                  <button type="button" onClick={handleChangeEmail} className={buttonClass('secondary')}>
                    변경
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={!canSendCode}
                    className={`${buttonClass('secondary')} min-w-[7.5rem] tabular-nums`}
                  >
                    {getSendCodeLabel()}
                  </button>
                )}
              </div>
              {renderEmailMessage()}
            </div>

            {isCodeStep && (
              <div className="animate-slide-up rounded-xl border border-accent/25 bg-accent/[0.04] p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="verificationCode" className="text-[13px] font-medium text-text-secondary">
                    인증번호
                  </label>
                  {codeSecondsLeft > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-accent-light">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                      {formatCountdown(codeSecondsLeft)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
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
                    className={`${inputClass(Boolean(errors.code))} min-w-0 flex-1 font-mono tracking-[0.35em] placeholder:tracking-normal placeholder:font-sans`}
                    placeholder="6자리 숫자"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={!canVerifyCode}
                    className={`${buttonClass('primary')} min-w-[5rem]`}
                  >
                    {isVerifyingCode ? '확인 중...' : '확인'}
                  </button>
                </div>
                {renderCodeMessage()}
              </div>
            )}
          </form>
        )}

        {signupMode === 'oauth' && (
          <p className="mt-6 text-sm leading-relaxed text-text-muted break-keep">
            GitHub, Google, 네이버 계정으로 간편하게 가입할 수 있어요. 아래 약관에 동의한 뒤 가입할 계정을 선택해주세요.
          </p>
        )}

        <fieldset className="mt-6 overflow-hidden rounded-xl border border-surface-border bg-surface-elevated/50">
          <legend className="sr-only">약관 동의</legend>
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
            <Checkbox checked={isAllAgreed} onChange={handleAllAgreementChange} />
            <span className="text-sm font-semibold text-text-primary">모두 동의하기</span>
          </label>
          <div className="space-y-3 border-t border-surface-border px-4 py-3.5">
            {AGREEMENT_ITEMS.map(({ key, label, document }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-3 text-[13px] text-text-secondary">
                  <Checkbox checked={agreements[key]} onChange={handleAgreementChange(key)} />
                  <span>
                    <span className="mr-1.5 font-medium text-accent-light">필수</span>
                    {label}
                  </span>
                </label>
                {document && (
                  <button
                    type="button"
                    onClick={() => setOpenDocument(document)}
                    className="inline-flex shrink-0 items-center text-xs text-text-muted transition-colors hover:text-text-primary"
                  >
                    보기
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </fieldset>
        {errors.agreements && <p className={errorTextClass}>{errors.agreements}</p>}

        {/* Reserves the widget's height so the buttons below don't jump */}
        <div className="mt-6 min-h-[65px]">
          <Turnstile
            ref={turnstileRef}
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

        {signupMode === 'local' ? (
          <button
            type="submit"
            form="local-signup-form"
            disabled={isLocalSignupDisabled || isSubmitting}
            className={`${buttonClass()} mt-4 w-full`}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                가입 중...
              </>
            ) : (
              '가입하기'
            )}
          </button>
        ) : (
          <div className="mt-4 space-y-2.5">
            {OAUTH_PROVIDERS.map((provider) => (
              <OAuthButton
                key={provider.id}
                provider={provider}
                onClick={() => handleOAuthSignup(provider.id)}
                disabled={isOAuthSignupDisabled}
              >
                {provider.label}로 가입하기
              </OAuthButton>
            ))}
          </div>
        )}
      </AuthLayout>

      <LegalDocumentModal
        documentKey={openDocument}
        onClose={() => setOpenDocument(null)}
      />
    </>
  );
}
