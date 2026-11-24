import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { deviceStorage } from '@/shared/utils/device-storage';

const server = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const recordedTime = z.record(z.iso.date(), z.number().nonnegative());
const writes = new Map<string, Promise<void>>();

function dayKey(day: Date) {
  return [day.getFullYear(), day.getMonth() + 1, day.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
}

export function useStudyTime() {
  const userId = useCurrentUser().data?.id;
  const key = `miraigo.study-time.${server}.${userId}`;
  const query = useQuery({
    queryKey: ['home', 'study-time', key],
    enabled: userId !== undefined,
    staleTime: Infinity,
    queryFn: async () => {
      const raw = await deviceStorage.get(key);
      if (!raw) return env.demoMode
        ? Object.fromEntries(Array.from({ length: 7 }, (_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - index);
          return [dayKey(date), [470, 890, 520, 1320, 680, 250, 410][index]];
        }))
        : {};
      try {
        const parsed = recordedTime.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : {};
      } catch {
        return {};
      }
    },
  });
  return { key, days: query.data, available: query.isSuccess };
}

export function useStudyTimeTracking(pathname: string) {
  const { key, available } = useStudyTime();
  const queryClient = useQueryClient();
  const tracking = /^\/(?:courses\/\d+\/lessons\/\d+|practice\/[^/]+|vocabulary(?:\/.*)?|grammar(?:\/.*)?|kana|kanji(?:\/.*)?)(?:\/|$)/.test(pathname);

  useEffect(() => {
    if (!available || !tracking) return;
    let startedAt = AppState.currentState === 'active' ? Date.now() : null;
    function record() {
      if (startedAt === null) return;
      const stop = Date.now();
      // Only count the time the app spent in the foreground on a study screen.
      const start = new Date(Math.max(startedAt, stop - 20_000));
      startedAt = stop;
      if (stop <= start.getTime()) return;
      const day = dayKey(start);
      const midnight = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getTime();
      const cutoff = new Date(start);
      cutoff.setDate(start.getDate() - 20);
      const cutoffKey = dayKey(cutoff);
      const next = queryClient.setQueryData<Record<string, number>>(['home', 'study-time', key], (previous) => {
        const current = Object.fromEntries(Object.entries(previous ?? {}).filter(([date]) => date >= cutoffKey));
        current[day] = (current[day] ?? 0) + (Math.min(stop, midnight) - start.getTime()) / 1000;
        if (stop > midnight) {
          const today = dayKey(new Date(stop));
          current[today] = (current[today] ?? 0) + (stop - midnight) / 1000;
        }
        return current;
      });
      const write = (writes.get(key) ?? Promise.resolve()).catch(() => undefined)
        .then(() => deviceStorage.set(key, JSON.stringify(next)));
      writes.set(key, write);
      void write.catch(() => undefined).finally(() => { if (writes.get(key) === write) writes.delete(key); });
    }

    const interval = setInterval(record, 15_000);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') startedAt ??= Date.now();
      else {
        record();
        startedAt = null;
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
      record();
    };
  }, [available, key, pathname, queryClient, tracking]);
}

export function studyWeek(data: Record<string, number> | undefined, previous: boolean, today = new Date()) {
  const daysSinceMonday = (today.getDay() + 6) % 7;
  return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - daysSinceMonday - (previous ? 7 : 0) + index);
    return { label, seconds: data?.[dayKey(day)] ?? 0 };
  });
}
