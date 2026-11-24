import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { speakingLessons, speakingModes } from '@/features/speaking/lessons';
import { createStudyStorage } from '@/shared/utils/study-storage';

const attemptSchema = z.object({
  id: z.string(), lessonId: z.string(), mode: z.enum(speakingModes), createdAt: z.iso.datetime(), seconds: z.number().nonnegative(),
  lines: z.array(z.object({ text: z.string(), score: z.number().min(0).max(100) }).nullable()),
});
export type SpeakingAttempt = z.infer<typeof attemptSchema>;
const storage = createStudyStorage('miraigo-speaking');
const scope = Array.from(env.apiBaseUrl, (char) => char.codePointAt(0)!.toString(16)).join('.');

export function speakingScore(attempt: SpeakingAttempt) {
  return Math.round(attempt.lines.reduce((sum, line) => sum + (line?.score ?? 0), 0) / Math.max(1, attempt.lines.length));
}

function demoAttempts(): SpeakingAttempt[] {
  return speakingLessons.filter((lesson) => lesson.level === 'N5').slice(0, 3).map((lesson, index) => ({
    id: 'demo-speech-' + index, lessonId: lesson.id, mode: 'Shadowing', createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    seconds: 190 + index * 28, lines: lesson.lines.map((line, lineIndex) => ({ text: line.japanese, score: 92 - ((index * 2 + lineIndex) % 5) * 3 })),
  }));
}

export function useSpeakingProgress() {
  const user = useCurrentUser();
  const [baseline] = useState(() => env.demoMode ? demoAttempts() : []);
  const key = `speaking.v1.${scope}.${user.data?.id ?? 'guest'}`;
  const queryKey = ['speaking', key];
  const client = useQueryClient();
  const query = useQuery({
    queryKey, enabled: !user.isPending, retry: false, staleTime: Infinity,
    queryFn: async () => {
      const prior = await storage.get(key);
      return prior ? attemptSchema.array().parse(JSON.parse(prior)) : baseline;
    },
  });
  const save = useMutation({
    scope: { id: key },
    mutationFn: async (attempt: SpeakingAttempt) => {
      const previous = client.getQueryData<SpeakingAttempt[]>(queryKey) ?? [];
      const next = [attempt, ...previous.filter((item) => item.id !== attempt.id)].slice(0, 100);
      await storage.set(key, JSON.stringify(next));
      client.setQueryData(queryKey, next);
    },
  });
  return { attempts: query.data ?? baseline, ready: query.isSuccess, failed: query.isError || save.isError, save: save.mutate };
}
