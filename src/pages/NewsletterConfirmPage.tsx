import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NewsletterActionCard, { newsletterActionButtonClass } from '../components/newsletter/NewsletterActionCard';
import { confirmNewsletter } from '../services/newsletter/newsletterService';
import { parseApiError } from '../lib/http/apiError';

type ConfirmResult =
  | { kind: 'confirmed'; email?: string }
  | { kind: 'expired' }
  | { kind: 'invalid' }
  | { kind: 'conflict'; message: string };

export default function NewsletterConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm only on an explicit click. Mail security scanners open links automatically,
  // so calling the API on page load could confirm a subscription the owner never clicked.
  const handleConfirm = async () => {
    if (!token) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { email } = await confirmNewsletter(token);
      setResult({ kind: 'confirmed', email });
    } catch (error: unknown) {
      console.error('Newsletter confirm error:', error);
      const { status, message } = parseApiError(error);
      if (status === 400) {
        setResult({ kind: 'expired' });
      } else if (status === 404) {
        setResult({ kind: 'invalid' });
      } else if (status === 409) {
        setResult({ kind: 'conflict', message: message || '이미 다른 계정에서 구독 중인 이메일입니다.' });
      } else {
        setErrorMessage('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <NewsletterActionCard
        tone="error"
        title="유효하지 않은 링크입니다"
        description="인증 메일에 있는 링크를 다시 확인해주세요."
      />
    );
  }

  if (result?.kind === 'confirmed') {
    return (
      <NewsletterActionCard
        tone="success"
        title="뉴스레터 구독이 완료되었습니다"
        description={
          result.email ? (
            <>
              <span className="text-text-primary font-medium">{result.email}</span>
              {' '}주소로 devport 뉴스레터를 보내드립니다.
            </>
          ) : (
            '앞으로 devport 뉴스레터를 보내드립니다.'
          )
        }
      >
        <Link to="/" className={newsletterActionButtonClass}>
          devport 둘러보기
        </Link>
      </NewsletterActionCard>
    );
  }

  if (result?.kind === 'expired') {
    return (
      <NewsletterActionCard
        tone="error"
        title="인증 링크가 만료되었습니다"
        description="인증 링크는 24시간 동안만 유효합니다. 마이페이지에서 다시 신청해주세요."
      >
        <Link to="/mypage?tab=newsletter" className={newsletterActionButtonClass}>
          다시 신청하기
        </Link>
      </NewsletterActionCard>
    );
  }

  if (result?.kind === 'invalid') {
    return (
      <NewsletterActionCard
        tone="error"
        title="유효하지 않거나 이미 사용된 링크입니다"
        description="이미 구독을 확인하셨다면 따로 하실 일은 없습니다. 구독 상태는 마이페이지에서 확인할 수 있습니다."
      >
        <Link to="/mypage?tab=newsletter" className={newsletterActionButtonClass}>
          구독 상태 확인하기
        </Link>
      </NewsletterActionCard>
    );
  }

  if (result?.kind === 'conflict') {
    return <NewsletterActionCard tone="error" title="구독을 완료할 수 없습니다" description={result.message} />;
  }

  return (
    <NewsletterActionCard
      tone="info"
      title="뉴스레터 구독 확인"
      description="아래 버튼을 누르면 devport 뉴스레터 구독이 완료됩니다."
    >
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400 text-center">{errorMessage}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className={newsletterActionButtonClass}
      >
        {isSubmitting ? '확인 중...' : '구독 확인하기'}
      </button>
    </NewsletterActionCard>
  );
}
