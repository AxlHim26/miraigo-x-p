// Auth remains in sessionStorage; learning preferences can survive a reload or tab close.
export const deviceStorage = {
  get: async (key: string) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  set: async (key: string, value: string) => window.localStorage.setItem(key, value),
};
