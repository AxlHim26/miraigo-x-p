import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { currentUserKey, useCurrentUser } from '@/features/auth/hooks/use-current-user';
import type { CurrentUser } from '@/features/auth/services/auth-service';
import { deviceStorage } from '@/shared/utils/device-storage';

const lessonSchema = z.object({
  courseId: z.number().int().positive(),
  lessonId: z.number().int().positive(),
  title: z.string().max(140),
});
type RecentLesson = z.infer<typeof lessonSchema>;
const backendScope = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (char) => char.codePointAt(0)!.toString(16)).join('.');
const storageKey = (userId: number) => `miraigo.recent-lesson.${backendScope}.${userId}`;
const queryKey = (userId: number | undefined) => ['courses', 'recent-lesson', userId] as const;
const pendingWrites = new Map<number, Promise<void>>();

export function useResumeLesson() {
  const user = useCurrentUser();
  const userId = user.isSuccess ? user.data.id : undefined;
  const query = useQuery({
    queryKey: queryKey(userId),
    enabled: userId !== undefined,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      if (userId === undefined) return null;
      const raw = await deviceStorage.get(storageKey(userId));
      if (!raw) return env.demoMode ? { courseId: 9100, lessonId: 9401, title: '自己紹介 · Giới thiệu bản thân' } : null;
      try {
        const parsed = lessonSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
  });
  return userId === undefined ? null : query.data ?? null;
}

export function useRememberLesson(courseId: number | null, lessonId: number | undefined, title: string | undefined) {
  const user = useCurrentUser(lessonId !== undefined);
  const userId = user.isSuccess ? user.data.id : undefined;
  const queryClient = useQueryClient();

  useFocusEffect(useCallback(() => {
    if (!userId || !courseId || !lessonId || !title) return;
    const record: RecentLesson = { courseId, lessonId, title: title.slice(0, 140) };
    const pending = pendingWrites.get(userId) ?? Promise.resolve();
    const write = pending.catch(() => {}).then(async () => {
      await deviceStorage.set(storageKey(userId), JSON.stringify(record));
      if (queryClient.getQueryData<CurrentUser>(currentUserKey)?.id === userId) {
        await queryClient.cancelQueries({ queryKey: queryKey(userId) });
        if (queryClient.getQueryData<CurrentUser>(currentUserKey)?.id === userId) queryClient.setQueryData(queryKey(userId), record);
      }
    });
    pendingWrites.set(userId, write);
    void write.catch(() => {}).finally(() => {
      if (pendingWrites.get(userId) === write) pendingWrites.delete(userId);
    });
  }, [courseId, lessonId, queryClient, title, userId]));
}
