import { useQuery } from '@tanstack/react-query';

import { getCourseTree } from '@/features/courses/services/course-service';

export const useHomeData = () =>
  useQuery({
    queryKey: ['courses', 'tree'],
    queryFn: getCourseTree,
    staleTime: 60_000,
    retry: 1,
  });
