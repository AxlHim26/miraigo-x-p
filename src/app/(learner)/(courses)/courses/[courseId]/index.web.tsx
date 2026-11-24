import { useLocalSearchParams } from 'expo-router';

import CourseChaptersPage from '@/features/web/courses/course-chapters-page';

export default function WebCourseChapters() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  return <CourseChaptersPage courseId={courseId} />;
}
