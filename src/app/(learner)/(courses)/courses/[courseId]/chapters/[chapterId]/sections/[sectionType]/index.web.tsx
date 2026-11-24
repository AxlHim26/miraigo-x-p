import { useLocalSearchParams } from 'expo-router';

import CourseLessonsPage from '@/features/web/courses/course-lessons-page';

export default function WebCourseLessonsPage() {
  const { courseId, chapterId, sectionType } = useLocalSearchParams<{ courseId: string; chapterId: string; sectionType: string }>();
  return <CourseLessonsPage courseId={courseId} chapterId={chapterId} sectionType={sectionType} />;
}
