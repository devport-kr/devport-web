import apiClient from '../../lib/http/apiClient';

// ─── Newsletter Types ────────────────────────────────────────────

export type NewsletterStatus = 'NONE' | 'PENDING' | 'ACTIVE';

export interface NewsletterSubscription {
  status: NewsletterStatus;
  email?: string;
  consentedAt?: string;
  verifiedAt?: string; // ACTIVE only
  verificationExpiresAt?: string; // PENDING only
}

export interface NewsletterActionResult {
  message: string;
  email?: string; // masked, e.g. "us***@example.com"
}

// ─── My Subscription APIs ────────────────────────────────────────

export const getMyNewsletter = async (): Promise<NewsletterSubscription> => {
  const response = await apiClient.get<NewsletterSubscription>('/api/newsletter/me');
  return response.data;
};

// Subscribe, resend the verification mail and change the email are all this one call.
export const subscribeNewsletter = async (
  email: string,
  turnstileToken: string
): Promise<NewsletterSubscription> => {
  const response = await apiClient.post<NewsletterSubscription>('/api/newsletter/me', {
    email,
    agreed: true,
    turnstileToken,
  });
  return response.data;
};

export const unsubscribeMyNewsletter = async (): Promise<void> => {
  await apiClient.delete('/api/newsletter/me');
};

// ─── Public Token APIs (links in newsletter emails) ──────────────

export const confirmNewsletter = async (token: string): Promise<NewsletterActionResult> => {
  const response = await apiClient.post<NewsletterActionResult>(
    '/api/newsletter/confirm',
    { token },
    { skipAuthRefresh: true } as any
  );
  return response.data;
};

export const unsubscribeNewsletterByToken = async (token: string): Promise<NewsletterActionResult> => {
  const response = await apiClient.post<NewsletterActionResult>(
    '/api/newsletter/unsubscribe',
    { token },
    { skipAuthRefresh: true } as any
  );
  return response.data;
};
