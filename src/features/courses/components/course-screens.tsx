import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack, LearnerLoadState } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, LearnerSectionHeading } from '@/components/ui/learner-glass';
import { useCourse } from '@/features/courses/hooks/use-course';
import type { Course } from '@/features/courses/services/course-service';
import { chaptersOf, sectionsOf, sortOrder } from '@/features/courses/utils/course-outline';
import { parseRouteId } from '@/shared/utils/route-id';

const lessonHref = (courseId: number, lessonId: number) => ({
  pathname: '/courses/[courseId]/lessons/[lessonId]' as const,
  params: { courseId, lessonId },
});

export function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = parseRouteId(courseId);
  const query = useCourse(id);
  return (
    <LearnerCanvas>
      <LearnerBack href="/courses" label="Khóa học" />
      <LearnerLoadState pending={query.isFetching && !query.data} error={query.error} missing={!id} retry={() => void query.refetch()} />
      {query.data && <CourseChapters key={query.data.id} course={query.data} />}
    </LearnerCanvas>
  );
}

function CourseChapters({ course }: { course: Course }) {
  const router = useRouter();
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const chapters = chaptersOf(course);
  return (
    <>
      <LearnerHeading eyebrow="LỘ TRÌNH HỌC" title={course.name} description={course.description ?? undefined} />
      <LearnerSectionHeading title="Chương học" />
      {chapters.length === 0 && <LearnerPanel><ThemedText>Khóa học này chưa có chương học.</ThemedText></LearnerPanel>}
      {chapters.map((chapter) => {
        const expanded = openChapter === chapter.id;
        const sections = expanded ? sectionsOf(chapter) : [];
        return (
          <LearnerPanel key={chapter.id}>
            <LearnerControl label={chapter.title} glyph={expanded ? '−' : '+'} accessibilityState={{ expanded }} onPress={() => setOpenChapter(expanded ? null : chapter.id)} style={styles.action} />
            {expanded && chapter.description && <ThemedText themeColor="textSecondary">{chapter.description}</ThemedText>}
            {expanded && sections.length === 0 && <ThemedText type="small">Chưa có phần học.</ThemedText>}
            {sections.map((section) => {
              const lessons = sortOrder(section.lessons, (lesson) => lesson.lessonOrder);
              return (
                <View key={section.id} style={styles.section}>
                  <ThemedText accessibilityRole="header" type="smallBold">{section.title}</ThemedText>
                  {lessons.length === 0 && <ThemedText type="small" themeColor="textSecondary">Chưa có bài học.</ThemedText>}
                  {lessons.map((lesson) => (
                    <LearnerControl key={lesson.id} label={lesson.title} glyph="›" onPress={() => router.push(lessonHref(course.id, lesson.id))} style={styles.action} />
                  ))}
                </View>
              );
            })}
          </LearnerPanel>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  action: { alignSelf: 'flex-start', maxWidth: '100%' },
  section: { gap: 8, paddingVertical: 5 },
});
