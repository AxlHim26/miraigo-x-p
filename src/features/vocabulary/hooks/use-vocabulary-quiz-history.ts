import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { vocabularyDay, vocabularyDays } from '@/features/vocabulary/data/vocabulary-study';
import { demoVocabularyHistory } from '@/integrations/demo/demo-progress';
import { deviceStorage } from '@/shared/utils/device-storage';

const server = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const scores = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]);
const history = z.object({ archived: scores, daily: z.record(z.iso.date(), scores) });
type QuizHistory = z.infer<typeof history>;
const empty: QuizHistory = { archived: [0, 0], daily: {} };
const saves = new Map<string, Promise<void>>();

export function vocabularyAccuracy(data: QuizHistory, range: 7 | 30 | 'all', now = new Date()) {
  const entries = range === 'all' ? Object.values(data.daily)
    : vocabularyDays(range, now).map((date) => data.daily[vocabularyDay(date)] ?? [0, 0]);
  const [correct, answered] = entries.reduce(([sum, count], [good, total]) => [sum + good, count + total],
    range === 'all' ? data.archived : [0, 0]);
  return answered ? Math.round(correct / answered * 100) : null;
}

export function useVocabularyQuizHistory() {
  const userId = useCurrentUser().data?.id;
  const key = `miraigo.vocabulary-quiz.${server}.${userId ?? 'guest'}`;
  const queryKey = ['vocabulary', 'quiz-history', key] as const;
  const cache = useQueryClient();
  const [error, setError] = useState(false);
  const query = useQuery({
    queryKey,
    staleTime: Infinity,
    queryFn: async () => {
      const raw = await deviceStorage.get(key);
      if (!raw) return env.demoMode ? history.parse({ archived: [0, 0], daily: demoVocabularyHistory() }) : empty;
      try {
        const parsed = history.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : empty;
      } catch {
        return empty;
      }
    },
  });

  function record(correct: number, answered: number) {
    if (!query.isSuccess || !answered) {
      setError(!query.isSuccess);
      return;
    }
    const now = new Date();
    const today = vocabularyDay(now);
    const earliest = vocabularyDay(vocabularyDays(30, now)[0]);
    const next = cache.setQueryData<QuizHistory>(queryKey, (previous = empty) => {
      const daily: QuizHistory['daily'] = {};
      const archived: QuizHistory['archived'] = [...previous.archived];
      for (const [day, [right, total]] of Object.entries(previous.daily)) {
        if (day >= earliest) daily[day] = [right, total];
        else { archived[0] += right; archived[1] += total; }
      }
      const [right, total] = daily[today] ?? [0, 0];
      daily[today] = [right + correct, total + answered];
      return { daily, archived };
    });
    const write = (saves.get(key) ?? Promise.resolve()).catch(() => undefined)
      .then(() => deviceStorage.set(key, JSON.stringify(next)));
    saves.set(key, write);
    void write.then(() => setError(false), () => setError(true)).finally(() => {
      if (saves.get(key) === write) saves.delete(key);
    });
  }

  return { data: query.data ?? empty, error: error || query.isError, record };
}
