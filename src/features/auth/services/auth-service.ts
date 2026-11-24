import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export type EmailVerificationStatus = {
  email: string;
  expiresInMinutes: number;
};

type AuthToken = { token: string };

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
};

export async function getCurrentUser(signal?: AbortSignal) {
  const response = await api.get<ApiEnvelope<CurrentUser>>('/api/v1/users/me', { signal });
  return response.data;
}

export async function authenticate(username: string, password: string) {
  const response = await api.post<ApiEnvelope<AuthToken>>('/api/v1/auth/authenticate', {
    username,
    password,
  });
  return response.data;
}

export async function registerAccount(input: {
  username: string;
  email: string;
  password: string;
}) {
  const response = await api.post<ApiEnvelope<EmailVerificationStatus>>('/api/v1/auth/register', input);
  return response.data;
}

export async function confirmEmailVerification(token: string) {
  const response = await api.post<ApiEnvelope<AuthToken>>(
    '/api/v1/auth/verification/confirm',
    { token },
  );
  return response.data;
}

export async function resendEmailVerification(email: string) {
  const response = await api.post<ApiEnvelope<EmailVerificationStatus>>(
    '/api/v1/auth/verification/resend',
    { email },
  );
  return response.data;
}

export async function logout() {
  await api.post<ApiEnvelope<null>>('/api/v1/auth/logout');
}
