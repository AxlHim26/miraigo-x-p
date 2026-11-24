import type { Course } from '@/features/courses/services/course-service';
import { normalizeStudySearch } from '@/shared/utils/study-search';

export const courseHref = (courseId: number) => ({ pathname: '/courses/[courseId]' as const, params: { courseId } });
export const lessonHref = (courseId: number, lessonId: number) => ({
  pathname: '/courses/[courseId]/lessons/[lessonId]' as const, params: { courseId, lessonId },
});
export const chapterHref = (courseId: number, chapterId: number, category?: string) => ({
  pathname: '/courses/[courseId]/chapters/[chapterId]' as const, params: { courseId, chapterId, ...(category ? { category } : {}) },
});
export const courseMediaHref = (courseId: number, mode: string, listId?: string) => ({
  pathname: '/courses/[courseId]/media' as const, params: { courseId, mode, ...(listId ? { listId } : {}) },
});
export const courseProgressHref = (courseId: number) => ({ pathname: '/courses/[courseId]/progress' as const, params: { courseId } });

export const courseLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const courseLevel = (course: Course) => courseLevels.find((level) => new RegExp(`\\b${level}\\b`, 'i').test(course.name));

export const courseCategories = ['Tất cả', 'Từ vựng', 'Ngữ pháp', 'Hội thoại'] as const;
export type CourseCategory = typeof courseCategories[number];

export function sectionMatches(type: string, title: string, category: CourseCategory) {
  if (category === 'Tất cả') return true;
  const normalized = normalizeStudySearch(title);
  if (category === 'Từ vựng') return type === 'VOCABULARY' || normalized.includes('tu vung');
  if (category === 'Ngữ pháp') return type === 'GRAMMAR' || normalized.includes('ngu phap');
  return type === 'CONVERSATION' || normalized.includes('hoi thoai') || normalized.includes('kaiwa');
}
