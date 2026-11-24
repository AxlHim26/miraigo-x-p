import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { AppProviders } from '@/core/providers/app-providers';
import { createAppTheme } from '@/features/web/theme/create-theme';
import { useThemeStore } from '@/features/web/theme/theme-store';

export function WebProviders({ children }: PropsWithChildren) {
  const mode = useThemeStore((state) => state.mode);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved = hasHydrated && mode !== 'system' ? mode : prefersDark ? 'dark' : 'light';
  const theme = useMemo(() => createAppTheme(resolved), [resolved]);
  const [cache] = useState(() => createCache({ key: 'mui', prepend: true }));

  useEffect(() => {
    void useThemeStore.persist?.rehydrate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = resolved;
  }, [resolved]);

  return (
    <AppProviders>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </AppProviders>
  );
}
