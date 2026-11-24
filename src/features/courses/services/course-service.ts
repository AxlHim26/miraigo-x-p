import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export type CourseLesson = {
  id: number;
  title: string;
  videoUrl: string | null;
  pdfUrl: string | null;
  lessonOrder: number | null;
};

export type CourseSection = {
  id: number;
  title: string;
  type: string;
  status?: 'ACTIVE' | 'DRAFT' | 'UNDER_DEVELOPMENT';
  sectionOrder: number | null;
  lessons?: CourseLesson[] | null;
};

export type CourseChapter = {
  id: number;
  title: string;
  description?: string | null;
  chapterOrder: number | null;
  sections?: CourseSection[] | null;
};

export type Course = {
  id: number;
  name: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  chapters?: CourseChapter[] | null;
};

export const getCourseTree = async () => {
  const response = await api.get<ApiEnvelope<Course[]>>('/api/v1/courses?tree=true');
  return response.data;
};

export const getCourse = async (courseId: number, signal?: AbortSignal) => {
  const response = await api.get<ApiEnvelope<Course>>(`/api/v1/courses/${courseId}`, { signal });
  return response.data;
};
