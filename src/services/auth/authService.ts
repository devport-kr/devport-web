import apiClient from '../../lib/http/apiClient';
import { API_BASE_URL } from '../../lib/http/apiClient';

// ─── Auth Types ──────────────────────────────────────────────────

export interface UserResponse {
  id: number;
  email: string;
  username?: string;
  name: string;
  profileImageUrl?: string;
  authProvider: 'github' | 'google' | 'naver' | 'local';
  role: 'USER' | 'ADMIN';
  emailVerified?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AccessTokenResponse {
  accessToken: string;
  expiresIn?: number;
}

export interface SignupResponse {
  verificationRequired?: boolean;
  email?: string;
  message?: string;
}

export interface OAuthExchangeRequest {
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ProfileUpdateRequest {
  email?: string;
  name?: string;
  profileImageUrl?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Auth APIs ───────────────────────────────────────────────────

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/api/auth/me', {
    skipAuthRedirect: true,
  } as any);
  return response.data;
};

export const initiateOAuthLogin = (provider: 'github' | 'google' | 'naver', turnstileToken: string): void => {
  // Spring Security OAuth2 default endpoint is /oauth2/authorization/{registrationId}
  // Append Turnstile token as query parameter for backend validation
  window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}?turnstile_token=${encodeURIComponent(turnstileToken)}`;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout', undefined, {
    withCredentials: true,
    skipAuthRefresh: true,
  } as any);
};

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/api/auth/signup', data, {
    skipAuthRefresh: true,
  } as any);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<AccessTokenResponse> => {
  const response = await apiClient.post<AccessTokenResponse>('/api/auth/login', data, {
    withCredentials: true,
    skipAuthRefresh: true,
  } as any);
  return response.data;
};

export const exchangeOAuthCode = async (
  data: OAuthExchangeRequest
): Promise<AccessTokenResponse> => {
  const response = await apiClient.post<AccessTokenResponse>('/api/auth/oauth2/exchange', data, {
    withCredentials: true,
    skipAuthRefresh: true,
  } as any);
  return response.data;
};

export const resendVerification = async (
  data: ResendVerificationRequest
): Promise<void> => {
  await apiClient.post('/api/auth/resend-verification', data, {
    skipAuthRefresh: true,
  } as any);
};

// ─── Profile APIs ────────────────────────────────────────────────

export const updateProfile = async (data: ProfileUpdateRequest): Promise<UserResponse> => {
  const response = await apiClient.put<UserResponse>('/api/profile', data);
  return response.data;
};

export const changePassword = async (data: PasswordChangeRequest): Promise<void> => {
  await apiClient.post('/api/profile/change-password', data);
};

export const removeEmail = async (): Promise<void> => {
  await apiClient.delete('/api/profile/email');
};
