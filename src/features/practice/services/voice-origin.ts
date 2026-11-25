import { env, getServiceOrigin } from '@/core/config/env';

/** Speech service origin: the AI platform when configured, otherwise the legacy voice service. */
export function getVoiceOrigin() {
  if (env.demoMode) return env.apiBaseUrl;
  return getServiceOrigin(env.aiBaseUrl) ?? getServiceOrigin(env.voiceBaseUrl);
}
