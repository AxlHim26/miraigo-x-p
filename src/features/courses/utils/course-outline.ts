import type { Course, CourseChapter } from '@/features/courses/services/course-service';

export const sortOrder = <T extends { id: number }>(items: T[] | null | undefined, order: (item: T) => number | null) =>
  [...(items ?? [])].sort((a, b) => (order(a) ?? Number.MAX_SAFE_INTEGER) - (order(b) ?? Number.MAX_SAFE_INTEGER) || a.id - b.id);

export const chaptersOf = (course: Course) => sortOrder(course.chapters, (chapter) => chapter.chapterOrder);
export const sectionsOf = (chapter: CourseChapter) => sortOrder(chapter.sections, (section) => section.sectionOrder);

export const orderedLessons = (course: Course) => chaptersOf(course).flatMap((chapter) =>
  sectionsOf(chapter).flatMap((section) =>
    sortOrder(section.lessons, (lesson) => lesson.lessonOrder).map((lesson) => ({ lesson, chapter, section }))));
