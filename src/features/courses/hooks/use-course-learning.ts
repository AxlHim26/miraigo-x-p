import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import type { Course } from '@/features/courses/services/course-service';
import { orderedLessons } from '@/features/courses/utils/course-outline';
import { demoVideo } from '@/integrations/demo/demo-data';
import { createStudyStorage } from '@/shared/utils/study-storage';

const listSchema = z.object({ id: z.string(), name: z.string(), lessons: z.array(z.number()) });
const positionSchema = z.object({ source: z.string(), seconds: z.number().nonnegative(), duration: z.number().positive() });
const courseStateSchema = z.object({
  completed: z.array(z.number()), lists: z.array(listSchema), positions: z.record(z.string(), positionSchema).default({}),
});
type CourseLearning = z.infer<typeof courseStateSchema>;

const initial: CourseLearning = { completed: [], lists: [], positions: {} };
const storage = createStudyStorage('miraigo-course-learning');
const server = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const writes = new Map<string, Promise<void>>();

function courseLearningQuery(courseId: number, userId: number | undefined, enabled: boolean) {
  const key = `course.v1.${server}.${userId ?? 'guest'}.${courseId}`;
  const baseline: CourseLearning = env.demoMode && courseId === 9100 ? {
    completed: [9400, 9403], positions: { '9401': { source: demoVideo, seconds: 3, duration: 8 } }, lists: [{ id: 'demo-daily', name: 'Học N5 mỗi ngày', lessons: [9400, 9401] }],
  } : initial;
  return {
    key, baseline,
    options: {
      queryKey: ['course-learning', key] as const, enabled: enabled && courseId > 0, staleTime: Infinity, retry: false,
      queryFn: async () => {
        const value = await storage.get(key);
        return value ? courseStateSchema.parse(JSON.parse(value)) : baseline;
      },
    },
  };
}

export function useCourseCompletions(courses: readonly Course[]) {
  const user = useCurrentUser();
  const queries = courses.map((course) => courseLearningQuery(course.id, user.data?.id, !user.isPending));
  const progress = useQueries({ queries: queries.map(({ options }) => options) });
  return courses.map((course, index) => {
    const lessons = orderedLessons(course);
    const completed = new Set((progress[index].data ?? queries[index].baseline).completed);
    return { course, total: lessons.length, completed: lessons.filter(({ lesson }) => completed.has(lesson.id)).length };
  });
}

export function useCourseLearning(courseId: number) {
  const user = useCurrentUser();
  const client = useQueryClient();
  const [failed, setFailed] = useState(false);
  const { key, baseline, options } = courseLearningQuery(courseId, user.data?.id, !user.isPending);
  const { queryKey } = options;
  const query = useQuery(options);

  function update(reduce: (current: CourseLearning) => CourseLearning) {
    if (!query.isSuccess) return;
    const next = client.setQueryData<CourseLearning>(queryKey, (current) => reduce(current ?? baseline));
    const write = (writes.get(key) ?? Promise.resolve()).catch(() => undefined)
      .then(() => storage.set(key, JSON.stringify(next)));
    writes.set(key, write);
    void write.then(() => setFailed(false), () => setFailed(true)).finally(() => {
      if (writes.get(key) === write) writes.delete(key);
    });
  }

  return {
    ...(query.data ?? baseline),
    userId: user.data?.id,
    ready: query.isSuccess,
    failed: failed || query.isError,
    complete: (lesson: number) => update((state) => state.completed.includes(lesson) ? state : { ...state, completed: [...state.completed, lesson] }),
    rememberPosition: (lesson: number, position: z.infer<typeof positionSchema>) => update((state) => ({
      ...state, positions: { ...state.positions, [lesson]: position },
    })),
    createList: (name: string, lesson?: number) => update((state) => ({
      ...state, lists: [...state.lists, { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name, lessons: lesson ? [lesson] : [] }],
    })),
    toggleListItem: (id: string, lesson: number) => update((state) => ({
      ...state, lists: state.lists.map((list) => list.id !== id ? list : {
        ...list, lessons: list.lessons.includes(lesson) ? list.lessons.filter((value) => value !== lesson) : [...list.lessons, lesson],
      }),
    })),
  };
}
