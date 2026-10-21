const readPublicEnv = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export const env = {
  apiBaseUrl: readPublicEnv(process.env.EXPO_PUBLIC_API_BASE_URL, 'http://localhost:8080'),
  appEnv: readPublicEnv(process.env.EXPO_PUBLIC_APP_ENV, 'development'),
} as const;

export type AppEnv = (typeof env)['appEnv'];
