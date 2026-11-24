import type { Href } from 'expo-router';

import { normalizeStudySearch } from '@/shared/utils/study-search';
import type { VocabularyEntry, VocabularyProgress } from '@/features/vocabulary/services/vocabulary-service';

export const vocabularyFilters = ['Tất cả', 'Chưa học', 'Đã học', 'Yêu thích'] as const;
export type VocabularyFilter = typeof vocabularyFilters[number];

export const vocabularySessionHref = (mode: string, level?: string, courseId?: number): Href => ({
  pathname: '/vocabulary/session',
  params: { mode, ...(level ? { level } : {}), ...(courseId ? { courseId } : {}) },
});

export function wordsForFilter<T extends VocabularyEntry>(words: readonly T[], filter: VocabularyFilter, progress: ReadonlyMap<number, VocabularyProgress>, favorites: ReadonlySet<number>) {
  return words.filter((word) => {
    if (filter === 'Chưa học') return !progress.has(word.id);
    if (filter === 'Đã học') return progress.has(word.id);
    if (filter === 'Yêu thích') return favorites.has(word.id);
    return true;
  });
}

export function wordsMatching<T extends VocabularyEntry>(words: readonly T[], search: string) {
  const query = normalizeStudySearch(search);
  return query ? words.filter((word) => [word.term, word.reading, word.meaning].some(
    (value) => value && normalizeStudySearch(value).includes(query),
  )) : words;
}

export function vocabularyQuestions<T extends VocabularyEntry>(words: readonly T[], offset = 0) {
  return words.flatMap((word, index) => {
    const answer = normalizeStudySearch(word.meaning);
    const seen = new Set([answer, '']);
    const choices: string[] = [];
    for (let step = 1; step < words.length && choices.length < 3; step += 1) {
      const alternative = words[(index + step) % words.length].meaning;
      const normalized = normalizeStudySearch(alternative);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      choices.push(alternative);
    }
    if (!answer || choices.length < 1) return [];
    choices.splice((index + word.id + offset) % (choices.length + 1), 0, word.meaning);
    return [{ word, choices, listen: (index + offset) % 2 === 1 }];
  }).slice(0, 10);
}

export function vocabularyDay(date = new Date()) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
}

export function vocabularyDays(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() - count + index + 1);
    return day;
  });
}
