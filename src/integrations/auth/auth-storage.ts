import { storage } from '@/shared/utils/storage';

const ACCESS_TOKEN_KEY = 'miraigo.access-token';

export const authStorage = {
  getAccessToken: () => storage.get(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => storage.set(ACCESS_TOKEN_KEY, token),
  clear: () => storage.remove(ACCESS_TOKEN_KEY),
};
