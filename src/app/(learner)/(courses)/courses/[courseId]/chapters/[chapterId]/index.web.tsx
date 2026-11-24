import { useLocalSearchParams } from 'expo-router';

import CourseSectionsPage from '@/features/web/courses/course-sections-page';

export default function WebCourseSectionsPage() {
  const { courseId, chapterId } = useLocalSearchParams<{ courseId: string; chapterId: string }>();
  return <CourseSectionsPage courseId={courseId} chapterId={chapterId} />;
}
