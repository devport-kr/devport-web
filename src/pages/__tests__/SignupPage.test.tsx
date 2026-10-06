import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';
import * as authService from '../../services/auth/authService';
import { CURRENT_TERMS_VERSION } from '../../content/legalDocuments';

const { resetTurnstile, authenticate } = vi.hoisted(() => ({
  resetTurnstile: vi.fn(),
  authenticate: vi.fn(),
}));

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

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ authenticate, isAuthenticated: false }),
}));

vi.mock('../../services/auth/authService', () => ({
  checkUsername: vi.fn(),
  initiateOAuthLogin: vi.fn(),
  sendSignupEmailCode: vi.fn(),
  verifySignupEmailCode: vi.fn(),
  signup: vi.fn(),
}));

const EMAIL = 'new@example.com';

const apiError = (status: number, message: string) => ({ response: { status, data: { message } } });

const renderPage = () =>
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>
  );

const fillAccountFields = () => {
  fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'newuser' } });
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password!1' } });
  fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password!1' } });
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: EMAIL } });
};

const sendCode = async () => {
  fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }));
  return (await screen.findByLabelText('인증번호')) as HTMLInputElement;
};

const verifyEmail = async () => {
  const codeInput = await sendCode();
  fireEvent.change(codeInput, { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
  await screen.findByText('이메일 인증이 완료되었습니다');
};

const submitButton = () => screen.getByRole('button', { name: '가입하기' }) as HTMLButtonElement;

describe('SignupPage email verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.checkUsername).mockResolvedValue(true);
    vi.mocked(authService.sendSignupEmailCode).mockResolvedValue({ expiresIn: 600, resendAvailableIn: 60 });
    vi.mocked(authService.verifySignupEmailCode).mockResolvedValue({
      verificationToken: 'verification-token',
      expiresIn: 1800,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sends the code with the Turnstile token, verifies it and signs up with the verification token', async () => {
    vi.mocked(authService.signup).mockResolvedValue({ accessToken: 'access-token' });
    renderPage();
    fillAccountFields();
    fireEvent.click(screen.getByLabelText('모두 동의하기'));

    // Agreements alone are not enough any more: the email has to be verified first.
    expect(submitButton().disabled).toBe(true);

    await verifyEmail();

    expect(authService.sendSignupEmailCode).toHaveBeenCalledWith({ email: EMAIL, turnstileToken: 'turnstile-token' });
    expect(resetTurnstile).toHaveBeenCalledTimes(1);
    expect(authService.verifySignupEmailCode).toHaveBeenCalledWith({ email: EMAIL, code: '123456' });
    expect((screen.getByLabelText('이메일') as HTMLInputElement).readOnly).toBe(true);
    expect(submitButton().disabled).toBe(false);

    fireEvent.click(submitButton());

    await waitFor(() => expect(authenticate).toHaveBeenCalledWith('access-token'));
    expect(authService.signup).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password!1',
      email: EMAIL,
      emailVerificationToken: 'verification-token',
      agreedTermsVersion: CURRENT_TERMS_VERSION,
    });
  });

  it('shows the registered-email error with a login link and still resets Turnstile', async () => {
    vi.mocked(authService.sendSignupEmailCode).mockRejectedValue(apiError(409, '이미 가입된 이메일입니다.'));
    renderPage();
    fillAccountFields();

    fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }));

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeTruthy();
    expect(screen.getByRole('link', { name: '로그인하기' })).toBeTruthy();
    expect(screen.queryByLabelText('인증번호')).toBeNull();
    expect(resetTurnstile).toHaveBeenCalledTimes(1);
  });

  it('shows the send limit message from the server', async () => {
    vi.mocked(authService.sendSignupEmailCode).mockRejectedValue(
      apiError(429, '이 이메일로 인증번호를 너무 많이 보냈습니다. 내일 다시 시도해주세요.')
    );
    renderPage();
    fillAccountFields();

    fireEvent.click(screen.getByRole('button', { name: '인증번호 받기' }));

    expect(await screen.findByText('이 이메일로 인증번호를 너무 많이 보냈습니다. 내일 다시 시도해주세요.')).toBeTruthy();
    expect(resetTurnstile).toHaveBeenCalledTimes(1);
  });

  it('stays on the code step after a wrong code', async () => {
    vi.mocked(authService.verifySignupEmailCode).mockRejectedValue(
      apiError(400, '인증번호가 올바르지 않습니다. (남은 시도 4회)')
    );
    renderPage();
    fillAccountFields();

    const codeInput = await sendCode();
    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('인증번호가 올바르지 않습니다. (남은 시도 4회)')).toBeTruthy();
    expect(screen.getByLabelText('인증번호')).toBeTruthy();
  });

  it('goes back to the send step when the code has to be requested again', async () => {
    vi.mocked(authService.verifySignupEmailCode).mockRejectedValue(
      apiError(400, '인증번호를 너무 많이 틀렸습니다. 인증번호를 다시 요청해주세요.')
    );
    renderPage();
    fillAccountFields();

    const codeInput = await sendCode();
    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('인증번호를 너무 많이 틀렸습니다. 인증번호를 다시 요청해주세요.')).toBeTruthy();
    expect(screen.queryByLabelText('인증번호')).toBeNull();
  });

  it('keeps the verification token when the username is taken', async () => {
    vi.mocked(authService.signup).mockRejectedValue(apiError(409, 'Username is not available: newuser'));
    renderPage();
    fillAccountFields();
    fireEvent.click(screen.getByLabelText('모두 동의하기'));
    await verifyEmail();

    fireEvent.click(submitButton());

    expect(await screen.findByText('이미 사용 중인 아이디입니다.')).toBeTruthy();
    expect(screen.getByText('이메일 인증이 완료되었습니다')).toBeTruthy();
    expect(submitButton().disabled).toBe(false);
  });

  it('puts an email conflict on the email field and asks to verify again', async () => {
    vi.mocked(authService.signup).mockRejectedValue(apiError(409, '이미 가입된 이메일입니다.'));
    renderPage();
    fillAccountFields();
    fireEvent.click(screen.getByLabelText('모두 동의하기'));
    await verifyEmail();

    fireEvent.click(submitButton());

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeTruthy();
    expect(screen.queryByText('이미 사용 중인 아이디입니다.')).toBeNull();
    expect((screen.getByLabelText('이메일') as HTMLInputElement).readOnly).toBe(false);
    expect(submitButton().disabled).toBe(true);
  });

  it('clears an expired verification token so the user verifies again', async () => {
    const message = '이메일 인증이 만료되었거나 올바르지 않습니다. 이메일을 다시 인증해주세요.';
    vi.mocked(authService.signup).mockRejectedValue(apiError(400, message));
    renderPage();
    fillAccountFields();
    fireEvent.click(screen.getByLabelText('모두 동의하기'));
    await verifyEmail();

    fireEvent.click(submitButton());

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText('이메일 인증이 완료되었습니다')).toBeNull();
    expect(submitButton().disabled).toBe(true);
  });
});
