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

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
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
  try {
    // Call backend to revoke refresh tokens
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear tokens from localStorage regardless of API call result
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  }
};

export const signup = async (data: SignupRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/api/auth/signup', data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/api/auth/login', data);
  return response.data;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    await apiClient.get('/api/auth/check-username', { params: { username } });
    return true; // Available
  } catch (error) {
    return false; // Not available
  }
};

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  try {
    await apiClient.get('/api/auth/check-email', { params: { email } });
    return true; // Available
  } catch (error) {
    return false; // Not available
  }
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
