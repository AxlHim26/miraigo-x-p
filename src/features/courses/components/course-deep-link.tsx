import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CourseDeepLink() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId?: string }>();

  return lessonId ? (
    <Redirect href={{ pathname: '/courses/[courseId]/lessons/[lessonId]', params: { courseId, lessonId } }} />
  ) : (
    <Redirect href={{ pathname: '/courses/[courseId]', params: { courseId } }} />
  );
}
