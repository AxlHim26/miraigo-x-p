import { env } from '@/core/config/env';
import { authStorage } from '@/integrations/auth/auth-storage';
import { createLocalSession } from '@/integrations/auth/local-session';
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

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(joinUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as ApiEnvelope<{ token: string }>;
      const token = payload.data?.token;
      if (token) await authStorage.setAccessToken(token);
      return token ?? null;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

type Transport = (url: string, options: RequestInit) => Promise<Response>;

export const apiResponse = async (
  path: string,
  options: ApiRequestOptions = {},
  transport: Transport = fetch,
  retried = false,
): Promise<Response> => {
  if (__DEV__ && env.demoMode) {
    const { demoResponse } = await import('@/integrations/demo/demo-api');
    return demoResponse(path, options);
  }
  let token = await authStorage.getAccessToken();
  if (!token && env.autoLogin && !path.startsWith('/api/v1/auth/')) {
    token = await createLocalSession();
  }
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await transport(joinUrl(path), {
    ...options,
    credentials: 'include',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && !retried && !path.startsWith('/api/v1/auth/')) {
    try {
      const token = await refreshAccessToken();
      if (token) return apiResponse(path, options, transport, true);
    } catch {
      // Expired or unavailable refresh cookie: clear the local access token below.
    }
    await authStorage.clear();
    if (env.autoLogin) {
      await createLocalSession();
      return apiResponse(path, options, transport, true);
    }
  }

  if (!response.ok) {
    const { message, errorCode } = await parseError(response);
    throw new ApiError(message, response.status, errorCode);
  }

  return response;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const response = await apiResponse(path, options);
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
