import { z } from 'zod';

import type { ListeningLesson, ListeningLine } from '@/features/listening/data/listening-lessons';

const count = z.number().int().nonnegative();
const totalsSchema = z.tuple([count, count, count, count]);
const lessonSchema = z.object({
  heard: count,
  line: count,
  opened: count,
  due: count,
  mastered: z.boolean(),
  favorite: z.boolean(),
});

export const listeningProgressSchema = z.object({
  lessons: z.record(z.string(), lessonSchema),
  days: z.record(z.iso.date(), totalsSchema),
  archived: totalsSchema,
});

export type ListeningProgress = z.infer<typeof listeningProgressSchema>;
export type LessonProgress = z.infer<typeof lessonSchema>;
type ListeningTotals = z.infer<typeof totalsSchema>;

export const emptyListeningProgress: ListeningProgress = { lessons: {}, days: {}, archived: [0, 0, 0, 0] };
const emptyLesson: LessonProgress = { heard: 0, line: 0, opened: 0, due: 0, mastered: false, favorite: false };
const emptyTotals: ListeningTotals = [0, 0, 0, 0];

export type ListeningAction =
  | { type: 'open'; lesson: ListeningLesson }
  | { type: 'favorite'; lesson: ListeningLesson }
  | { type: 'heard'; lesson: ListeningLesson; index: number }
  | { type: 'submit'; lesson?: ListeningLesson; answers: number; correct: number; review: boolean };

function dateBefore(date: Date, days: number) {
  const previous = new Date(date);
  previous.setDate(date.getDate() - days);
  return previous;
}

function dateKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
}

function addTotals(a: ListeningTotals, b: ListeningTotals): ListeningTotals {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

function recordTotals(progress: ListeningProgress, values: ListeningTotals, now: Date): ListeningProgress {
  const today = dateKey(now);
  const cutoff = dateKey(dateBefore(now, 29));
  const days: ListeningProgress['days'] = {};
  let archived = progress.archived;
  for (const [date, totals] of Object.entries(progress.days)) {
    if (date < cutoff) archived = addTotals(archived, totals);
    else days[date] = totals;
  }
  days[today] = addTotals(days[today] ?? emptyTotals, values);
  return { ...progress, days, archived };
}

export function lessonCompleted(lesson: ListeningLesson, progress: LessonProgress | undefined) {
  return progress?.heard === (1 << lesson.lines.length) - 1;
}

export function applyListeningAction(progress: ListeningProgress, action: ListeningAction, now = new Date()): ListeningProgress {
  const lesson = action.lesson;
  let next = progress;

  if (lesson) {
    const previous = progress.lessons[lesson.id] ?? emptyLesson;
    let entry = previous;
    if (action.type === 'open') {
      entry = { ...previous, opened: now.getTime() };
    } else if (action.type === 'favorite') {
      entry = { ...previous, favorite: !previous.favorite };
    } else if (action.type === 'heard') {
      if (action.index < 0 || action.index >= lesson.lines.length) return progress;
      entry = {
        ...previous,
        heard: previous.heard | (1 << action.index),
        line: Math.min(action.index + 1, lesson.lines.length - 1),
        opened: now.getTime(),
      };
      if (lessonCompleted(lesson, entry) && !lessonCompleted(lesson, previous)) {
        entry = { ...entry, line: 0, due: previous.due || dateBefore(now, -1).getTime() };
        next = recordTotals(next, [1, 0, 0, 0], now);
      }
    } else {
      const mastered = action.correct / Math.max(action.answers, 1) >= 0.8;
      entry = { ...previous, mastered, due: dateBefore(now, mastered ? -5 : -1).getTime(), opened: now.getTime() };
    }
    next = { ...next, lessons: { ...next.lessons, [lesson.id]: entry } };
  }

  return action.type === 'submit'
    ? recordTotals(next, [0, action.review ? 1 : 0, action.correct, action.answers], now)
    : next;
}

export function listeningDays(progress: ListeningProgress, countDays: number, now = new Date()) {
  return Array.from({ length: countDays }, (_, index) => {
    const day = dateBefore(now, countDays - index - 1);
    return { day, values: progress.days[dateKey(day)] ?? emptyTotals };
  });
}

export function listeningTotals(progress: ListeningProgress, range: 7 | 30 | 'all', now = new Date()) {
  if (range === 'all') return Object.values(progress.days).reduce(addTotals, progress.archived);
  return listeningDays(progress, range, now).map(({ values }) => values).reduce(addTotals, emptyTotals);
}

export function isListeningReviewDue(progress: LessonProgress, now: number) {
  return !progress.mastered || progress.due <= now;
}

export function normalizeListeningAnswer(text: string) {
  return text.normalize('NFKC')
    .replace(/[\p{White_Space}\p{Punctuation}]/gu, '')
    .replace(/[ァ-ヶ]/g, (letter) => String.fromCharCode(letter.charCodeAt(0) - 0x60));
}

export function matchesDictation(line: ListeningLine, answer: string) {
  const entered = normalizeListeningAnswer(answer);
  return !!entered && [line.japanese, line.reading, line.speakText]
    .some((value) => value && normalizeListeningAnswer(value) === entered);
}
