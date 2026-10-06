import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import NewsletterPanel from '../NewsletterPanel';
import * as newsletterService from '../../../services/newsletter/newsletterService';

const { resetTurnstile } = vi.hoisted(() => ({ resetTurnstile: vi.fn() }));

// Hands out a token on mount, like the real widget does once the challenge passes.
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: forwardRef<unknown, { onSuccess: (token: string) => void }>(function MockTurnstile({ onSuccess }, ref) {
    useImperativeHandle(ref, () => ({ reset: resetTurnstile }));
    useEffect(() => {
      onSuccess('turnstile-token');
    }, [onSuccess]);
    return null;
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'oauth@example.com' } }),
}));

vi.mock('../../../services/newsletter/newsletterService', () => ({
  getMyNewsletter: vi.fn(),
  subscribeNewsletter: vi.fn(),
  unsubscribeMyNewsletter: vi.fn(),
}));

const agreeToBothConsents = () => {
  fireEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
  fireEvent.click(screen.getByLabelText(/이메일 수신에 동의합니다/));
};

describe('NewsletterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('subscribes with the prefilled email and resets Turnstile afterwards', async () => {
    vi.mocked(newsletterService.getMyNewsletter).mockResolvedValue({ status: 'NONE' });
    vi.mocked(newsletterService.subscribeNewsletter).mockResolvedValue({
      status: 'PENDING',
      email: 'oauth@example.com',
      verificationExpiresAt: '2026-10-07T10:00:00Z',
    });

    render(<NewsletterPanel />);

    const emailInput = (await screen.findByLabelText('이메일')) as HTMLInputElement;
    expect(emailInput.value).toBe('oauth@example.com');

    const submitButton = screen.getByRole('button', { name: '구독 신청' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    agreeToBothConsents();
    expect(submitButton.disabled).toBe(false);
    fireEvent.click(submitButton);

    expect(await screen.findByText('인증 대기')).toBeTruthy();
    expect(screen.getByText(/인증 메일을 보냈습니다/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '인증 메일 다시 보내기' })).toBeTruthy();
    expect(newsletterService.subscribeNewsletter).toHaveBeenCalledWith('oauth@example.com', 'turnstile-token');
    expect(resetTurnstile).toHaveBeenCalledTimes(1);
  });

  it('shows the server message on 429 and still resets Turnstile', async () => {
    vi.mocked(newsletterService.getMyNewsletter).mockResolvedValue({ status: 'NONE' });
    vi.mocked(newsletterService.subscribeNewsletter).mockRejectedValue({
      response: { status: 429, data: { message: '1분 후에 다시 시도해주세요.' } },
    });

    render(<NewsletterPanel />);
    await screen.findByLabelText('이메일');
    agreeToBothConsents();
    fireEvent.click(screen.getByRole('button', { name: '구독 신청' }));

    expect(await screen.findByText('1분 후에 다시 시도해주세요.')).toBeTruthy();
    expect(resetTurnstile).toHaveBeenCalledTimes(1);
  });

  it('maps a 400 email validation error to Korean text', async () => {
    vi.mocked(newsletterService.getMyNewsletter).mockResolvedValue({ status: 'NONE' });
    vi.mocked(newsletterService.subscribeNewsletter).mockRejectedValue({
      response: { status: 400, data: { message: 'Validation failed', validationErrors: { email: 'must be a well-formed email address' } } },
    });

    render(<NewsletterPanel />);
    await screen.findByLabelText('이메일');
    agreeToBothConsents();
    fireEvent.click(screen.getByRole('button', { name: '구독 신청' }));

    expect(await screen.findByText('올바른 이메일 주소를 입력해주세요.')).toBeTruthy();
  });

  it('unsubscribes an active subscription after confirmation', async () => {
    vi.mocked(newsletterService.getMyNewsletter).mockResolvedValue({
      status: 'ACTIVE',
      email: 'reader@example.com',
      verifiedAt: '2026-10-01T00:00:00Z',
    });
    vi.mocked(newsletterService.unsubscribeMyNewsletter).mockResolvedValue();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<NewsletterPanel />);
    expect(await screen.findByText('reader@example.com')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '구독 해지' }));

    expect(await screen.findByText(/구독이 해지되었습니다/)).toBeTruthy();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(newsletterService.unsubscribeMyNewsletter).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '구독 신청' })).toBeTruthy();
  });

  it('keeps the subscription when the unsubscribe confirmation is cancelled', async () => {
    vi.mocked(newsletterService.getMyNewsletter).mockResolvedValue({
      status: 'ACTIVE',
      email: 'reader@example.com',
      verifiedAt: '2026-10-01T00:00:00Z',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<NewsletterPanel />);
    fireEvent.click(await screen.findByRole('button', { name: '구독 해지' }));

    expect(newsletterService.unsubscribeMyNewsletter).not.toHaveBeenCalled();
    expect(screen.getByText('구독 중')).toBeTruthy();
  });
});
