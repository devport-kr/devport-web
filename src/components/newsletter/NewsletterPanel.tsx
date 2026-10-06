import { useCallback, useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMyNewsletter,
  subscribeNewsletter,
  unsubscribeMyNewsletter,
  type NewsletterSubscription,
} from '../../services/newsletter/newsletterService';
import { parseApiError } from '../../lib/http/apiError';

const EMAIL_MAX_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VERIFICATION_SENT = "인증 메일을 보냈습니다. 메일의 링크에서 '구독 확인'을 눌러주세요 (24시간 이내).";
const VERIFICATION_RESENT = "인증 메일을 다시 보냈습니다. 메일의 링크에서 '구독 확인'을 눌러주세요 (24시간 이내).";
const EMAIL_CHANGED = '새 이메일 주소로 인증 메일을 보냈습니다. 인증을 마치기 전까지는 뉴스레터가 발송되지 않습니다.';
const REQUEST_FAILED = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

const inputClass = 'w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors';
const checkboxClass = 'mt-1 h-4 w-4 rounded border-surface-border bg-surface-card text-accent focus:ring-accent';
const btnPrimary = 'px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'px-5 py-2.5 bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnDanger = 'px-5 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' }) : '-';

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('ko-KR', { dateStyle: 'long' }) : '-';

const getSubscribeErrorMessage = (error: unknown): string => {
  const { status, message, validationErrors } = parseApiError(error);

  if (status === 400) {
    if (validationErrors.email) return '올바른 이메일 주소를 입력해주세요.';
    if (validationErrors.agreed) return '필수 항목에 동의해주세요.';
    if (validationErrors.turnstileToken) return '봇 검증을 완료해주세요.';
    if (message === 'Bot verification failed') return '봇 검증에 실패했습니다. 다시 시도해주세요.';
  }
  // 409 / 429 / 503 messages come from the server in Korean.
  if ((status === 409 || status === 429 || status === 503) && message) {
    return message;
  }
  return REQUEST_FAILED;
};

export default function NewsletterPanel() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<NewsletterSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  const [consents, setConsents] = useState({ privacy: false, receive: false });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setSubscription(await getMyNewsletter());
      setLoadFailed(false);
    } catch (fetchError) {
      console.error('Failed to load newsletter subscription:', fetchError);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const resetTurnstile = () => {
    turnstileRef.current?.reset();
    setTurnstileToken(null);
  };

  const clearMessages = () => {
    setError(null);
    setNotice(null);
  };

  const requestVerificationMail = async (targetEmail: string, successNotice: string) => {
    if (!turnstileToken) {
      setError('봇 검증을 완료해주세요.');
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      setSubscription(await subscribeNewsletter(targetEmail, turnstileToken));
      setIsEditingEmail(false);
      setConsents({ privacy: false, receive: false });
      setNotice(successNotice);
    } catch (subscribeError) {
      console.error('Newsletter subscribe error:', subscribeError);
      setError(getSubscribeErrorMessage(subscribeError));
    } finally {
      // Turnstile tokens are single-use: get a fresh one for the next request.
      resetTurnstile();
      setIsSubmitting(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > EMAIL_MAX_LENGTH) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    if (!consents.privacy || !consents.receive) {
      setError('필수 항목에 동의해주세요.');
      return;
    }

    await requestVerificationMail(
      trimmedEmail,
      subscription?.status === 'ACTIVE' ? EMAIL_CHANGED : VERIFICATION_SENT
    );
  };

  const handleResend = () => {
    if (subscription?.email) {
      requestVerificationMail(subscription.email, VERIFICATION_RESENT);
    }
  };

  const handleStartEditEmail = () => {
    clearMessages();
    setEmail(subscription?.email ?? '');
    setConsents({ privacy: false, receive: false });
    setIsEditingEmail(true);
  };

  const handleCancelEditEmail = () => {
    clearMessages();
    setIsEditingEmail(false);
    resetTurnstile();
  };

  const handleUnsubscribe = async () => {
    const isActive = subscription?.status === 'ACTIVE';
    if (isActive && !window.confirm('뉴스레터 구독을 해지하시겠습니까?\n해지하면 등록된 이메일 주소가 즉시 삭제됩니다.')) {
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      await unsubscribeMyNewsletter();
      setSubscription({ status: 'NONE' });
      setIsEditingEmail(false);
      setEmail(user?.email ?? '');
      setNotice(isActive ? '구독이 해지되었습니다. 처리 결과 안내 메일이 발송됩니다.' : '구독 신청을 취소했습니다.');
    } catch (unsubscribeError) {
      console.error('Newsletter unsubscribe error:', unsubscribeError);
      setError(parseApiError(unsubscribeError).message || REQUEST_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadFailed || !subscription) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 text-center">
        <p className="text-sm text-text-muted mb-4">뉴스레터 구독 정보를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            fetchSubscription();
          }}
          className={btnSecondary}
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { status } = subscription;
  const showEmailForm = status === 'NONE' || isEditingEmail;
  const needsTurnstile = status !== 'ACTIVE' || isEditingEmail;
  const hasConsented = consents.privacy && consents.receive;

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-green-400">{notice}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmitEmail} noValidate className="bg-surface-card border border-surface-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h3 className="text-lg font-medium text-text-primary">뉴스레터</h3>
          {status === 'PENDING' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
              인증 대기
            </span>
          )}
          {status === 'ACTIVE' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
              구독 중
            </span>
          )}
        </div>
        <p className="text-sm text-text-muted mb-6">
          개발 트렌드와 devport 소식을 이메일로 받아보세요.
        </p>

        {status !== 'NONE' && (
          <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-y-2 text-sm mb-6">
            <dt className="text-text-muted">이메일</dt>
            <dd className="text-text-primary break-all">{subscription.email}</dd>
            {status === 'PENDING' ? (
              <>
                <dt className="text-text-muted">인증 기한</dt>
                <dd className="text-text-primary">{formatDateTime(subscription.verificationExpiresAt)}</dd>
              </>
            ) : (
              <>
                <dt className="text-text-muted">구독 시작일</dt>
                <dd className="text-text-primary">{formatDate(subscription.verifiedAt)}</dd>
              </>
            )}
          </dl>
        )}

        {status === 'PENDING' && !isEditingEmail && (
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            메일함에서 인증 메일의 '구독 확인'을 눌러야 구독이 완료됩니다. 메일이 보이지 않으면 스팸함을 확인해주세요.
          </p>
        )}

        {status === 'ACTIVE' && isEditingEmail && (
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            이메일을 변경하면 새 주소로 인증을 다시 완료해야 하며, 인증 전까지는 뉴스레터가 발송되지 않습니다.
          </p>
        )}

        {showEmailForm && (
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="newsletter-email" className="block text-sm font-medium text-text-secondary mb-2">
                {isEditingEmail ? '새 이메일' : '이메일'}
              </label>
              <input
                type="email"
                id="newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={EMAIL_MAX_LENGTH}
                autoComplete="email"
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 space-y-4">
              <div>
                <label className="flex items-start gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={consents.privacy}
                    onChange={(e) => setConsents((prev) => ({ ...prev, privacy: e.target.checked }))}
                    className={checkboxClass}
                  />
                  <span>[필수] 뉴스레터 발송을 위한 개인정보 수집·이용 동의</span>
                </label>
                <div className="mt-2 pl-7 space-y-0.5 text-xs text-text-muted leading-relaxed">
                  <p>· 수집 항목: 이메일 주소</p>
                  <p>· 이용 목적: devport 뉴스레터 발송 및 구독 관리</p>
                  <p>· 보유 기간: 구독 해지 또는 회원 탈퇴 시까지 (해지 즉시 파기)</p>
                  <p>※ 동의를 거부할 수 있으며, 거부 시 뉴스레터를 받아보실 수 없습니다.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={consents.receive}
                  onChange={(e) => setConsents((prev) => ({ ...prev, receive: e.target.checked }))}
                  className={checkboxClass}
                />
                <span>[필수] devport 뉴스레터(개발 트렌드 및 서비스 소식) 이메일 수신에 동의합니다.</span>
              </label>
            </div>
          </div>
        )}

        {needsTurnstile && (
          <div className="mb-6">
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
        )}

        <div className="flex flex-wrap gap-3">
          {showEmailForm ? (
            <>
              <button
                type="submit"
                disabled={isSubmitting || !turnstileToken || !hasConsented}
                className={btnPrimary}
              >
                {isSubmitting ? '처리 중...' : isEditingEmail ? '변경하고 인증 메일 받기' : '구독 신청'}
              </button>
              {isEditingEmail && (
                <button type="button" onClick={handleCancelEditEmail} disabled={isSubmitting} className={btnSecondary}>
                  취소
                </button>
              )}
            </>
          ) : status === 'PENDING' ? (
            <>
              <button
                type="button"
                onClick={handleResend}
                disabled={isSubmitting || !turnstileToken}
                className={btnPrimary}
              >
                {isSubmitting ? '처리 중...' : '인증 메일 다시 보내기'}
              </button>
              <button type="button" onClick={handleStartEditEmail} disabled={isSubmitting} className={btnSecondary}>
                이메일 변경
              </button>
              <button type="button" onClick={handleUnsubscribe} disabled={isSubmitting} className={btnDanger}>
                신청 취소
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleStartEditEmail} disabled={isSubmitting} className={btnSecondary}>
                이메일 변경
              </button>
              <button type="button" onClick={handleUnsubscribe} disabled={isSubmitting} className={btnDanger}>
                구독 해지
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
