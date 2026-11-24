import { useQuery } from '@tanstack/react-query';

import { getCourseTree, type Course } from '@/features/courses/services/course-service';
import type { CourseTree } from '@/features/web/courses/course-tree';
import { parseSectionType } from '@/features/web/courses/course-tree-selectors';
import { ApiError } from '@/shared/utils/api-error';

const normalizeTree = (courses: Course[]): CourseTree[] => courses.map((course) => ({
  ...course,
  chapters: (course.chapters ?? []).map((chapter) => ({
    ...chapter,
    sections: (chapter.sections ?? []).flatMap((section) => {
      const type = parseSectionType(section.type);
      return type ? [{ ...section, type, lessons: section.lessons ?? [] }] : [];
    }),
  })),
}));

export function useCourseTreeData() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['courses', 'tree'],
    queryFn: getCourseTree,
    select: normalizeTree,
    retry: (attempt, cause) => attempt < 1 && !(cause instanceof ApiError && [401, 403].includes(cause.status)),
  });

  return {
    courses: data ?? [],
    isLoading,
    isError,
    unauthorized: error instanceof ApiError && [401, 403].includes(error.status),
  };
}
