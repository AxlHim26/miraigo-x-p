import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

import { findCourseById, getLessonPath, parsePositiveInt } from '@/features/web/courses/course-tree-selectors';
import { useCourseTreeData } from '@/features/web/courses/use-course-tree-data';

export default function WebCourseLessonRedirect() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const { courses, isLoading, isError } = useCourseTreeData();
  if (isLoading) return <CircularProgress size={32} />;
  if (isError) return <Alert severity="error">Không thể tải bài học.</Alert>;

  const course = findCourseById(courses, parsePositiveInt(courseId));
  const targetId = parsePositiveInt(lessonId);
  if (course && targetId) {
    for (const chapter of course.chapters) {
      const section = chapter.sections.find((item) => item.lessons.some((lesson) => lesson.id === targetId));
      if (section) {
        return <Redirect href={getLessonPath(course.id, chapter.id, section.type, targetId) as Href} />;
      }
    }
  }
  return <Alert severity="warning">Không tìm thấy bài học theo đường dẫn hiện tại.</Alert>;
}
