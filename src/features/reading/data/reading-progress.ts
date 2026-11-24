import { z } from 'zod';

import { readingLibrary } from '@/features/reading/data/reading-library';
import { readingArticleSchema, readingOptionSchema, type ReadingArticle, type ReadingOption, type ReadingWord } from '@/features/reading/data/reading-schema';

const count = z.number().int().nonnegative();
const score = z.tuple([count, count, count]);
const answersSchema = z.record(z.string().regex(/^q-[1-9][0-9]*$/), readingOptionSchema);

export const readingProgressSchema = z.object({
  articles: z.array(readingArticleSchema),
  entries: z.record(z.string(), z.object({
    opened: count,
    saved: z.boolean(),
    draft: answersSchema.nullable(),
    result: answersSchema.nullable(),
  })),
  savedWords: z.array(z.string()),
  days: z.record(z.iso.date(), score),
  archived: score,
});

export type ReadingProgress = z.infer<typeof readingProgressSchema>;
export type ReadingAnswers = z.infer<typeof answersSchema>;
type Entry = ReadingProgress['entries'][string];
type Totals = z.infer<typeof score>;
const zero: Totals = [0, 0, 0];
export const emptyReadingProgress: ReadingProgress = { articles: [], entries: {}, savedWords: [], days: {}, archived: zero };

export type ReadingAction =
  | { type: 'add'; article: ReadingArticle }
  | { type: 'word'; word: ReadingWord }
  | { type: 'open' | 'save' | 'retry' | 'submit'; article: ReadingArticle }
  | { type: 'answer'; article: ReadingArticle; question: string; option: ReadingOption };

export function articleById(state: ReadingProgress, id: string | undefined) {
  return readingLibrary.find((article) => article.id === id) ?? state.articles.find((article) => article.id === id);
}

export function wordKey(word: ReadingWord) {
  return JSON.stringify([word.term, word.reading]);
}

export function readingStatus(entry: Entry | undefined) {
  if (!entry || (!entry.opened && !entry.result)) return 'Chưa học';
  return entry.draft === null && entry.result ? 'Đã xong' : 'Đang học';
}

export function readingResult(article: ReadingArticle, answers: ReadingAnswers) {
  return article.questions.filter((item) => answers[item.id] === item.correctOptionId).length;
}

export function readingDate(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
}

function shifted(day: Date, offset: number) {
  const date = new Date(day);
  date.setDate(date.getDate() + offset);
  return date;
}

function sum(a: Totals, b: Totals): Totals {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function recordTotals(state: ReadingProgress, day: Date, totals: Totals): ReadingProgress {
  const cutoff = readingDate(shifted(day, -29));
  const key = readingDate(day);
  const days: ReadingProgress['days'] = {};
  let archived = state.archived;
  for (const [date, value] of Object.entries(state.days)) {
    if (date < cutoff) archived = sum(archived, value);
    else days[date] = value;
  }
  days[key] = sum(days[key] ?? zero, totals);
  return { ...state, days, archived };
}

export function applyReadingAction(state: ReadingProgress, action: ReadingAction, now = new Date()): ReadingProgress {
  if (action.type === 'word') {
    const key = wordKey(action.word);
    return { ...state, savedWords: state.savedWords.includes(key)
      ? state.savedWords.filter((word) => word !== key) : [...state.savedWords, key] };
  }

  const { article } = action;
  if (action.type === 'add') {
    if (articleById(state, article.id)) return state;
    return { ...state, articles: [...state.articles, article] };
  }
  const previous = state.entries[article.id] ?? { opened: 0, saved: false, draft: {}, result: null };
  let entry = previous;
  let updated = state;
  if (action.type === 'open') entry = { ...previous, opened: now.getTime() };
  if (action.type === 'save') entry = { ...previous, saved: !previous.saved };
  if (action.type === 'retry') entry = { ...previous, opened: now.getTime(), draft: {} };
  if (action.type === 'answer') {
    const item = article.questions.find((question) => question.id === action.question);
    if (!previous.draft || !item?.options.some((choice) => choice.id === action.option) || previous.draft[item.id] === action.option) return state;
    entry = { ...previous, opened: now.getTime(), draft: { ...previous.draft, [item.id]: action.option } };
  }
  if (action.type === 'submit') {
    const draft = previous.draft;
    if (!draft || !article.questions.every((item) => item.options.some((option) => option.id === draft[item.id]))) return state;
    updated = recordTotals(state, now, [previous.result ? 0 : 1, article.questions.length, readingResult(article, draft)]);
    entry = { ...previous, opened: now.getTime(), draft: null, result: draft };
  }
  return { ...updated, entries: { ...updated.entries, [article.id]: entry } };
}

export function readingDays(state: ReadingProgress, countDays: number, now = new Date()) {
  return Array.from({ length: countDays }, (_, index) => {
    const date = shifted(now, index - countDays + 1);
    return { date, values: state.days[readingDate(date)] ?? zero };
  });
}

export function readingWeek(state: ReadingProgress, previous: boolean, now = new Date()) {
  const monday = shifted(now, -((now.getDay() + 6) % 7) - (previous ? 7 : 0));
  return readingDays(state, 7, shifted(monday, 6));
}

export function readingTotals(state: ReadingProgress, range: 7 | 30 | 'all', now = new Date()) {
  return range === 'all' ? Object.values(state.days).reduce(sum, state.archived)
    : readingDays(state, range, now).map(({ values }) => values).reduce(sum, zero);
}
