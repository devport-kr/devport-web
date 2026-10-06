import type { AxiosError } from 'axios';

/** Error body returned by every devport-api endpoint. */
export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  validationErrors?: Record<string, string>;
}

export interface ParsedApiError {
  status?: number;
  message?: string;
  validationErrors: Record<string, string>;
}

export const parseApiError = (error: unknown): ParsedApiError => {
  const response = (error as AxiosError<ApiErrorPayload> | undefined)?.response;
  return {
    status: response?.status,
    message: response?.data?.message,
    validationErrors: response?.data?.validationErrors ?? {},
  };
};

export const isBotVerificationFailure = ({ message, validationErrors }: ParsedApiError): boolean =>
  message === 'Bot verification failed' || 'turnstileToken' in validationErrors;
