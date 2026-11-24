import { env } from '@/core/config/env';
import { authStorage } from '@/integrations/auth/auth-storage';
import type { ApiEnvelope } from '@/shared/types/api';
import { ApiError } from '@/shared/utils/api-error';

let pendingSession: Promise<string> | null = null;

export function createLocalSession(): Promise<string> {
  if (!env.autoLogin) return Promise.reject(new Error('Local automatic login is disabled'));
  if (!pendingSession) {
    pendingSession = (async () => {
      const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}/api/v1/auth/local-session`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new ApiError('Không mở được phiên thử nghiệm local.', response.status);
      }
      const payload = await response.json() as ApiEnvelope<{ token: string }>;
      if (!payload.data?.token) throw new Error('Missing local access token');
      await authStorage.setAccessToken(payload.data.token);
      return payload.data.token;
    })().finally(() => { pendingSession = null; });
  }
  return pendingSession;
}
