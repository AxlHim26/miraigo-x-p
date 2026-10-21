import { env } from '@/core/config/env';
import { authStorage } from '@/integrations/auth/auth-storage';
import type { ApiEnvelope, ApiRequestOptions } from '@/shared/types/api';
import { ApiError } from '@/shared/utils/api-error';

const parseError = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return { message: response.statusText || 'Request failed', errorCode: undefined };
  }

  try {
    const payload = JSON.parse(text) as Partial<ApiEnvelope<unknown>>;
    return {
      message: payload.message || response.statusText || 'Request failed',
      errorCode: payload.errorCode,
    };
  } catch {
    return { message: text, errorCode: undefined };
  }
};

const joinUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${env.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}) => {
  const token = await authStorage.getAccessToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(joinUrl(path), {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const { message, errorCode } = await parseError(response);
    throw new ApiError(message, response.status, errorCode);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
};

export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
