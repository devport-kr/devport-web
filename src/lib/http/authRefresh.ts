import axios from 'axios';
import apiClient, { API_BASE_URL } from './apiClient';
import { clearAccessToken, getAccessToken, setAccessToken } from './authSession';

let refreshPromise: Promise<string> | null = null;

/**
 * Register request and response interceptors on the shared apiClient.
 * Call this once at app startup (e.g. in main.tsx or an init module).
 *
 * - Request interceptor: attaches the in-memory access token.
 * - Response interceptor: handles 401 by refreshing the token through
 *   a shared refresh promise and retrying once.
 */
export function registerAuthInterceptors(): void {
  // Add access token to requests if available
  apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  });

  // Handle token refresh on 401 errors
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as any;
      const skipAuthRedirect = Boolean(originalRequest?.skipAuthRedirect);
      const skipAuthRefresh = Boolean(originalRequest?.skipAuthRefresh);

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry && !skipAuthRefresh) {
        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers ?? {};

        try {
          const accessToken = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          if (!skipAuthRedirect) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post<{ accessToken: string }>(
      `${API_BASE_URL}/api/auth/refresh`,
      undefined,
      {
        withCredentials: true,
      }
    )
    .then((response) => {
      const nextAccessToken = response.data.accessToken;
      if (!nextAccessToken) {
        throw new Error('Refresh response missing access token');
      }

      setAccessToken(nextAccessToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${nextAccessToken}`;

      return nextAccessToken;
    })
    .catch((error) => {
      clearAccessToken();
      delete apiClient.defaults.headers.common.Authorization;
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function ensureAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) {
    return token;
  }

  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
}
