import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { env } from '@/core/config/env';
import { logout } from '@/features/auth/services/auth-service';
import { authStorage } from '@/integrations/auth/auth-storage';

export function useLogout() {
  const [logoutPending, setLogoutPending] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    if (logoutPending) return;
    setLogoutPending(true);
    try {
      await logout();
    } catch {
      // Clear the local session even when the server cannot be reached.
    } finally {
      try {
        if (!env.demoMode) await authStorage.clear();
      } catch {
        // A secure-storage failure must not prevent leaving the authenticated UI.
      }
      queryClient.clear();
      router.replace('/login');
      setLogoutPending(false);
    }
  };

  return { handleLogout, logoutPending };
}
