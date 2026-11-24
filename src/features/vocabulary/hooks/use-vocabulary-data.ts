import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import {
  getVocabularyCatalog, getVocabularyCourse, getVocabularyProgress, getVocabularyStats, vocabularyProgressKey, type VocabularyEntry,
} from '@/features/vocabulary/services/vocabulary-service';
import { ApiError } from '@/shared/utils/api-error';
import { readDeviceBookmark } from '@/shared/hooks/use-device-bookmark';

export type CatalogWord = VocabularyEntry & { courseId: number };

export const vocabularyLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type VocabularyLevel = typeof vocabularyLevels[number];

export function useVocabularyCatalog() {
  return useInfiniteQuery({
    queryKey: ['vocabulary', 'catalog'],
    queryFn: ({ pageParam, signal }) => getVocabularyCatalog(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => last.courses.length
      && pages.reduce((count, page) => count + page.courses.length, 0) < last.total ? pages.length : undefined,
    staleTime: 60_000,
  });
}

export function useVocabularyWords(level?: VocabularyLevel | 'all', courseId?: number, enabled = true) {
  const catalog = useVocabularyCatalog();
  const courses = catalog.data?.pages.flatMap((page) => page.courses) ?? [];
  const ids = courseId ? [courseId] : courses
    .filter((course) => !level || level === 'all' || course.level?.toUpperCase() === level).map((course) => course.id);
  const details = useQueries({
    queries: enabled ? ids.map((id) => ({
      queryKey: ['vocabulary', 'course', id],
      queryFn: ({ signal }: { signal: AbortSignal }) => getVocabularyCourse(id, signal),
      staleTime: 60_000,
    })) : [],
  });
  const words = details.flatMap(({ data }) => data?.entries?.map((entry): CatalogWord => ({
    ...entry,
    level: entry.level || data.level,
    courseId: data.id,
  })) ?? []);
  return {
    catalog,
    courses,
    words: [...new Map(words.map((word) => [word.id, word])).values()],
    pending: (!courseId && catalog.isPending) || details.some((query) => query.isPending),
    error: (!courseId ? catalog.error : null) ?? details.find((query) => query.isError)?.error,
    retry: () => {
      if (catalog.isError) void catalog.refetch();
      for (const detail of details) if (detail.isError) void detail.refetch();
    },
  };
}

export function useVocabularyProgress() {
  const userId = useCurrentUser().data?.id;
  const progress = useQuery({
    queryKey: [...vocabularyProgressKey, userId],
    queryFn: ({ signal }) => getVocabularyProgress(signal),
    enabled: userId !== undefined,
    staleTime: 60_000,
    retry: (attempt, error) => attempt < 1 && !(error instanceof ApiError && [401, 403, 404].includes(error.status)),
  });
  const stats = useQuery({
    queryKey: ['vocabulary', 'stats', userId],
    queryFn: getVocabularyStats,
    enabled: userId !== undefined,
    staleTime: 60_000,
  });
  return { progress, stats, byId: new Map(progress.data?.map((entry) => [entry.vocabId, entry])) };
}

export function useVocabularyFavorites(words: readonly CatalogWord[], enabled: boolean) {
  const userId = useCurrentUser().data?.id;
  const ids = words.map(({ id }) => id).sort((a, b) => a - b);
  return useQuery({
    queryKey: ['vocabulary', 'favorites', userId, ids],
    enabled: enabled && userId !== undefined,
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      if (userId === undefined) return [];
      const saved: number[] = [];
      for (let start = 0; start < ids.length; start += 24) {
        if (signal.aborted) break;
        const batch = ids.slice(start, start + 24);
        const checks = await Promise.all(batch.map((id) => readDeviceBookmark(userId, `word.${id}`)));
        for (const [index, checked] of checks.entries()) if (checked) saved.push(batch[index]);
      }
      return saved;
    },
  });
}
