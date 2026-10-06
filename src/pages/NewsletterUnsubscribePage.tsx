import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NewsletterActionCard, { newsletterActionButtonClass } from '../components/newsletter/NewsletterActionCard';
import { unsubscribeNewsletterByToken } from '../services/newsletter/newsletterService';
import { parseApiError } from '../lib/http/apiError';

type UnsubscribeResult = 'unsubscribed' | 'alreadyDone';

export default function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [result, setResult] = useState<UnsubscribeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unsubscribe only on an explicit click, so link scanners can't trigger it by opening the page.
  const handleUnsubscribe = async () => {
    if (!token) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await unsubscribeNewsletterByToken(token);
      setResult('unsubscribed');
    } catch (error: unknown) {
      console.error('Newsletter unsubscribe error:', error);
      if (parseApiError(error).status === 404) {
        setResult('alreadyDone');
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
        description="뉴스레터 메일 하단의 수신거부 링크를 다시 확인해주세요."
      />
    );
  }

  if (result === 'unsubscribed') {
    return (
      <NewsletterActionCard
        tone="success"
        title="수신 거부가 처리되었습니다"
        description="앞으로 뉴스레터가 발송되지 않습니다."
      />
    );
  }

  if (result === 'alreadyDone') {
    return (
      <NewsletterActionCard
        tone="info"
        title="이미 수신 거부되었거나 유효하지 않은 링크입니다"
        description="이 링크로 더 처리할 일은 없습니다."
      />
    );
  }

  return (
    <NewsletterActionCard
      tone="info"
      title="뉴스레터 수신 거부"
      description="수신 거부하면 등록된 이메일 주소가 즉시 삭제되고, 더 이상 뉴스레터가 발송되지 않습니다."
    >
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400 text-center">{errorMessage}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={isSubmitting}
        className={newsletterActionButtonClass}
      >
        {isSubmitting ? '처리 중...' : '수신 거부하기'}
      </button>
    </NewsletterActionCard>
  );
}
