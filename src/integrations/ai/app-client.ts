import { env, getServiceOrigin } from '@/core/config/env';
import { api } from '@/integrations/api/api-client';
import { authStorage } from '@/integrations/auth/auth-storage';

import { createAiClient, type AiClient } from './ai-client';

let appClient: AiClient | null | undefined;

/**
 * The AI client for this app, or `null` when no AI platform is configured (`EXPO_PUBLIC_AI_BASE_URL`)
 * or the app runs in demo mode. Callers fall back to the legacy voice service / demo data on `null`.
 */
export const getAiClient = async (): Promise<AiClient | null> => {
  if (env.demoMode) return null;
  if (appClient !== undefined) return appClient;

  const origin = getServiceOrigin(env.aiBaseUrl);
  if (!origin) return (appClient = null);

  // expo/fetch is the fetch that understands expo-file-system `File` parts in FormData; React Native's
  // `{ uri, name, type }` parts are rejected with "Unsupported FormDataPart implementation".
  const { fetch: expoFetch } = await import('expo/fetch');
  appClient = createAiClient({
    baseUrl: origin,
    fetch: expoFetch as unknown as typeof fetch,
    getAccessToken: authStorage.getAccessToken,
    // Any backend call goes through the shared single-flight 401 -> refresh logic, which rotates the
    // stored access token; read it back afterwards. A dead session clears the token -> null.
    refreshAccessToken: async () => {
      await api.get('/api/v1/users/me').catch(() => undefined);
      return authStorage.getAccessToken();
    },
  });
  return appClient;
};
