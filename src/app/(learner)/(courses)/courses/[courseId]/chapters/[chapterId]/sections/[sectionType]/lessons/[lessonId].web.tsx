import { useLocalSearchParams } from 'expo-router';

import CourseLessonViewerPage from '@/features/web/courses/course-lesson-viewer-page';

export default function WebCourseLessonViewerPage() {
  const { courseId, chapterId, sectionType, lessonId } = useLocalSearchParams<{ courseId: string; chapterId: string; sectionType: string; lessonId: string }>();
  return <CourseLessonViewerPage courseId={courseId} chapterId={chapterId} sectionType={sectionType} lessonId={lessonId} />;
}
