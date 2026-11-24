import { Platform } from 'react-native';

const readPublicEnv = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const defaultApiBaseUrl = readPublicEnv(process.env.EXPO_PUBLIC_API_BASE_URL, 'http://localhost:8080');

const demoMode = __DEV__ && Platform.OS !== 'web'
  && process.env.EXPO_PUBLIC_APP_ENV !== 'production'
  && process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export const env = {
  demoMode,
  apiBaseUrl: Platform.OS === 'web'
    ? readPublicEnv(process.env.EXPO_PUBLIC_WEB_API_BASE_URL, defaultApiBaseUrl)
    : demoMode ? 'https://demo.miraigo.invalid' : defaultApiBaseUrl,
  frontendBaseUrl: process.env.EXPO_PUBLIC_FE_BASE_URL?.trim() || '',
  voiceBaseUrl: process.env.EXPO_PUBLIC_VOICE_API_URL?.trim() || '',
  appEnv: readPublicEnv(process.env.EXPO_PUBLIC_APP_ENV, 'development'),
  autoLogin: !demoMode && __DEV__ && process.env.EXPO_PUBLIC_APP_ENV === 'development'
    && process.env.EXPO_PUBLIC_DEV_AUTO_LOGIN === 'true',
} as const;

export type AppEnv = (typeof env)['appEnv'];

export function getServiceOrigin(base: string, allowLocalHttp = env.appEnv === 'development') {
  try {
    const url = new URL(base);
    const localHost = /^(localhost|127\.0\.0\.1|10\.(?:\d+\.){2}\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname);
    if (url.username || url.password || (url.protocol !== 'https:' && !(allowLocalHttp && localHost && url.protocol === 'http:'))) return null;
    return url.origin;
  } catch {
    return null;
  }
}
