import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { createStudyStorage } from '@/shared/utils/study-storage';

const time = z.number().int().nonnegative();
const recordSchema = z.object({
  opened: time, examples: z.boolean(), completed: z.boolean(), saved: z.boolean(), due: time, mastered: z.boolean(), lastGrade: z.boolean().optional(),
});
const grammarSchema = z.object({ entries: z.record(z.string(), recordSchema), days: z.record(z.iso.date(), time) });
type GrammarRecord = z.infer<typeof recordSchema>;
type GrammarStudy = z.infer<typeof grammarSchema>;
type Action = { id: string; type: 'open' | 'examples' | 'favorite' | 'learned' }
  | { id: string; type: 'grade'; correct: number; total: number };
const empty: GrammarStudy = { entries: {}, days: {} };
const untouched: GrammarRecord = { opened: 0, examples: false, completed: false, saved: false, due: 0, mastered: false };
const files = createStudyStorage('miraigo-grammar');
const scope = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const writes = new Map<string, Promise<void>>();

function dayKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
}

function daysFrom(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + offset);
  return next;
}

export function grammarStatus(entry?: GrammarRecord) {
  return entry?.completed ? 'Đã xong' : entry?.opened ? 'Đang học' : 'Chưa học';
}

export function grammarProgress(entry?: GrammarRecord) {
  return entry?.completed ? 1 : entry?.examples ? 0.7 : entry?.opened ? 0.4 : 0;
}

export function grammarWeek(days: GrammarStudy['days'], previous: boolean, now = new Date()) {
  const start = daysFrom(now, -((now.getDay() + 6) % 7) - (previous ? 7 : 0));
  return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, index) => (
    { label, total: days[dayKey(daysFrom(start, index))] ?? 0 }
  ));
}

export function updateGrammarStudy(state: GrammarStudy, action: Action, now = new Date()): GrammarStudy {
  const previous = state.entries[action.id] ?? untouched;
  let entry = previous;
  if (action.type === 'open') entry = { ...previous, opened: now.getTime() };
  if (action.type === 'examples') entry = { ...previous, examples: true };
  if (action.type === 'favorite') entry = { ...previous, saved: !previous.saved };
  if (action.type === 'learned') entry = { ...previous, completed: true, opened: now.getTime(), due: previous.due || daysFrom(now, 1).getTime() };
  if (action.type === 'grade') {
    const mastered = action.total > 0 && action.correct / action.total >= 0.8;
    entry = { ...previous, opened: now.getTime(), completed: previous.completed || mastered,
      mastered, lastGrade: mastered, due: daysFrom(now, mastered ? 5 : 1).getTime() };
  }

  const completedToday = entry.completed && !previous.completed;
  const today = dayKey(now);
  const cutoff = dayKey(daysFrom(now, -29));
  const days = completedToday
    ? { ...Object.fromEntries(Object.entries(state.days).filter(([date]) => date >= cutoff)), [today]: (state.days[today] ?? 0) + 1 }
    : state.days;
  return { entries: { ...state.entries, [action.id]: entry }, days };
}

export function useGrammarStudy() {
  const user = useCurrentUser();
  const key = `grammar.v1.${scope}.${user.data?.id ?? 'guest'}`;
  const cache = useQueryClient();
  const [saveError, setSaveError] = useState(false);
  const query = useQuery({
    queryKey: ['grammar-study', key],
    enabled: !user.isPending,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const raw = await files.get(key);
      if (raw) return grammarSchema.parse(JSON.parse(raw));
      if (!env.demoMode) return empty;
      const day = new Date();
      return ['n5-01', 'n5-05', 'n5-06', 'n5-13'].reduce((state, id, index) => {
        const date = daysFrom(day, -(index + 1));
        const graded = updateGrammarStudy(state, { id, type: 'grade', correct: index < 2 ? 5 : 3, total: 5 }, date);
        return index === 0 ? updateGrammarStudy(graded, { id, type: 'favorite' }, date) : graded;
      }, empty);
    },
  });
  const record = useCallback((action: Action) => {
    if (!query.isSuccess) return;
    const queryKey = ['grammar-study', key] as const;
    const next = cache.setQueryData<GrammarStudy>(queryKey, (current) => updateGrammarStudy(current ?? empty, action));
    const write = (writes.get(key) ?? Promise.resolve()).catch(() => undefined)
      .then(() => files.set(key, JSON.stringify(next)));
    writes.set(key, write);
    void write.then(() => setSaveError(false), () => setSaveError(true)).finally(() => {
      if (writes.get(key) === write) writes.delete(key);
    });
  }, [cache, key, query.isSuccess]);
  return { state: query.data ?? empty, ready: query.isSuccess, readError: query.isError, retry: query.refetch, saveError, record };
}
