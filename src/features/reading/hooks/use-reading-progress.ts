import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { applyReadingAction, emptyReadingProgress, readingProgressSchema, type ReadingAction, type ReadingProgress } from '@/features/reading/data/reading-progress';
import { demoReadingProgress } from '@/integrations/demo/demo-progress';
import { readingStorage } from '@/features/reading/services/reading-storage';

const scope = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const writes = new Map<string, Promise<void>>();

export function useReadingProgress() {
  const user = useCurrentUser();
  const key = `reading.v1.${scope}.${user.data?.id ?? 'guest'}`;
  const cache = useQueryClient();
  const [saveError, setSaveError] = useState(false);
  const query = useQuery({
    queryKey: ['reading', key],
    queryFn: async () => {
      const raw = await readingStorage.get(key);
      return raw ? readingProgressSchema.parse(JSON.parse(raw)) : env.demoMode ? demoReadingProgress() : emptyReadingProgress;
    },
    enabled: !user.isPending,
    staleTime: Infinity,
    retry: false,
  });

  const record = useCallback((action: ReadingAction) => {
    if (!query.isSuccess) return;
    const queryKey = ['reading', key] as const;
    const previous = cache.getQueryData<ReadingProgress>(queryKey) ?? emptyReadingProgress;
    const next = applyReadingAction(previous, action);
    if (next === previous) return;
    cache.setQueryData(queryKey, next);
    const write = (writes.get(key) ?? Promise.resolve()).catch(() => undefined)
      .then(() => readingStorage.set(key, JSON.stringify(next)));
    writes.set(key, write);
    void write.then(() => setSaveError(false), () => setSaveError(true)).finally(() => {
      if (writes.get(key) === write) writes.delete(key);
    });
  }, [cache, key, query.isSuccess]);

  return { progress: query.data ?? emptyReadingProgress, ready: query.isSuccess, readError: query.isError, saveError, record, retry: query.refetch };
}
