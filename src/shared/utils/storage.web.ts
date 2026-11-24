// SecureStore has no browser implementation. Keep the web session scoped to its tab.
export const storage = {
  get: async (key: string) => (typeof window === 'undefined' ? null : window.sessionStorage.getItem(key)),
  set: async (key: string, value: string) => window.sessionStorage.setItem(key, value),
  remove: async (key: string) => window.sessionStorage.removeItem(key),
};
