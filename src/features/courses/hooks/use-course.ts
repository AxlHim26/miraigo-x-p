import { useQuery } from '@tanstack/react-query';

import { getCourse } from '@/features/courses/services/course-service';

export function useCourse(id: number | null) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: ({ signal }) => {
      if (id === null) throw new Error('Invalid course ID');
      return getCourse(id, signal);
    },
    enabled: id !== null,
    staleTime: 60_000,
  });
}
