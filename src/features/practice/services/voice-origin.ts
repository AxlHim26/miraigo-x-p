import { env, getServiceOrigin } from '@/core/config/env';

export function getVoiceOrigin() {
  return env.demoMode ? env.apiBaseUrl : getServiceOrigin(env.voiceBaseUrl);
}
