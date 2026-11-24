import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { dailyExercises, type DailyExercise } from '@/features/home/data/home-study';
import { deviceStorage } from '@/shared/utils/device-storage';

const studySchema = z.object({
  day: z.iso.date(),
  completed: z.array(z.enum(dailyExercises.map((exercise) => exercise.id))).max(dailyExercises.length),
  previousStreak: z.number().int().nonnegative(),
});
type StudyRecord = z.infer<typeof studySchema>;

const backendScope = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');

function localDate(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
}

function studyDay(now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return { today: localDate(now), yesterday: localDate(yesterday) };
}

function dayRecord(record: StudyRecord | null | undefined, day: ReturnType<typeof studyDay>): StudyRecord {
  if (record?.day === day.today) return record;
  return {
    day: day.today,
    completed: [],
    previousStreak: record?.day === day.yesterday && record.completed.length > 0 ? record.previousStreak + 1 : 0,
  };
}

export function useDailyStudy() {
  const user = useCurrentUser();
  const userId = user.data?.id;
  const key = `miraigo.daily-study.${backendScope}.${userId}`;
  const queryKey = ['home', 'daily-study', key] as const;
  const queryClient = useQueryClient();
  const [day, setDay] = useState(studyDay);
  const demoRecord: StudyRecord | null = env.demoMode ? { day: day.today, completed: ['vocabulary'], previousStreak: 11 } : null;
  const study = useQuery({
    queryKey,
    enabled: userId !== undefined,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const stored = await deviceStorage.get(key);
      if (!stored) return demoRecord;
      try {
        const parsed = studySchema.safeParse(JSON.parse(stored));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
  });
  const toggle = useMutation({
    mutationFn: async (exercise: DailyExercise) => {
      const current = dayRecord(study.data, studyDay());
      const completed = current.completed.includes(exercise)
        ? current.completed.filter((item) => item !== exercise)
        : [...current.completed, exercise];
      const next = { ...current, completed };
      await deviceStorage.set(key, JSON.stringify(next));
      return { key, record: next };
    },
    onSuccess: (next) => queryClient.setQueryData(['home', 'daily-study', next.key], next.record),
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const now = new Date();
      const current = studyDay(now);
      setDay((previous) => previous.today === current.today ? previous : current);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 100);
    }
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  const record = dayRecord(study.data === undefined ? demoRecord : study.data, day);
  return {
    completed: record.completed,
    streak: record.previousStreak + Number(record.completed.length > 0),
    available: userId !== undefined && study.isSuccess,
    saving: toggle.isPending,
    saveError: toggle.isError,
    readError: study.isError,
    retryRead: study.refetch,
    toggle: toggle.mutate,
  };
}
