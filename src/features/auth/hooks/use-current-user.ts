import { useQuery } from '@tanstack/react-query';

import { getCurrentUser } from '@/features/auth/services/auth-service';
import { ApiError } from '@/shared/utils/api-error';

export const currentUserKey = ['auth', 'current-user'] as const;

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: ({ signal }) => getCurrentUser(signal),
    enabled,
    staleTime: 5 * 60_000,
    retry: (count, error) => count < 1 && !(error instanceof ApiError && [401, 403].includes(error.status)),
  });
}
