import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { applyListeningAction, emptyListeningProgress, listeningProgressSchema, type ListeningAction, type ListeningProgress } from '@/features/listening/data/listening-progress';
import { demoListeningProgress } from '@/integrations/demo/demo-progress';
import { deviceStorage } from '@/shared/utils/device-storage';

const server = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const writes = new Map<string, Promise<void>>();

export function useListeningProgress() {
  const user = useCurrentUser();
  const key = `miraigo.listening.v1.${server}.${user.data?.id ?? 'guest'}`;
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState(false);
  const query = useQuery({
    queryKey: ['listening', key],
    enabled: !user.isPending,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const raw = await deviceStorage.get(key);
      if (!raw) return env.demoMode ? demoListeningProgress() : emptyListeningProgress;
      try {
        const parsed = listeningProgressSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : emptyListeningProgress;
      } catch {
        return emptyListeningProgress;
      }
    },
  });

  const record = useCallback((action: ListeningAction) => {
    if (!query.isSuccess) return;
    const result = queryClient.setQueryData<ListeningProgress>(['listening', key], (progress) =>
      applyListeningAction(progress ?? emptyListeningProgress, action));
    const write = (writes.get(key) ?? Promise.resolve()).catch(() => undefined)
      .then(() => deviceStorage.set(key, JSON.stringify(result)));
    writes.set(key, write);
    void write.then(() => setSaveError(false), () => setSaveError(true)).finally(() => {
      if (writes.get(key) === write) writes.delete(key);
    });
  }, [key, query.isSuccess, queryClient]);

  return {
    progress: query.data ?? emptyListeningProgress,
    ready: query.isSuccess,
    readError: query.isError,
    saveError,
    retry: query.refetch,
    record,
  };
}
