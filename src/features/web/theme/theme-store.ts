import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
  mode: ThemeMode;
  hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'app-theme',
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ mode }) => ({ mode }),
      skipHydration: true,
      onRehydrateStorage: () => () => useThemeStore.setState({ hasHydrated: true }),
    },
  ),
);
