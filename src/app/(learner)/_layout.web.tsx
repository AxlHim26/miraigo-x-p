import CircularProgress from '@mui/material/CircularProgress';
import { Redirect, Slot, usePathname, type Href } from 'expo-router';
import { useSyncExternalStore } from 'react';

import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { env } from '@/core/config/env';
import { createAuthRoute } from '@/features/web/auth/redirect';
import AppShell from '@/features/web/layout/app-shell';
import CommandPalette from '@/features/web/layout/command-palette';
import { ApiError } from '@/shared/utils/api-error';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function LearnerRoutes() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const user = useCurrentUser(mounted);

  if (!env.autoLogin && mounted && !user.isFetching && user.error instanceof ApiError && [401, 403].includes(user.error.status)) {
    return <Redirect href={createAuthRoute('/login', pathname) as Href} />;
  }

  if (mounted && !user.isFetching && user.isError) {
    return (
      <main className="grid min-h-screen place-content-center gap-4 text-center">
        <p>Không thể kết nối với MiraiGo.</p>
        <button type="button" onClick={() => void user.refetch()}>Thử lại</button>
      </main>
    );
  }

  if (!user.data) {
    return <div className="grid min-h-screen place-items-center"><CircularProgress size={32} /></div>;
  }

  return (
    <AppShell>
      <Slot />
      <CommandPalette />
    </AppShell>
  );
}

export default function LearnerWebLayout() {
  const pathname = usePathname();
  return pathname === '/' ? <Slot /> : <LearnerRoutes />;
}
