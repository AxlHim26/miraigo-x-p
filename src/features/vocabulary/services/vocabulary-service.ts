import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export type VocabularyCourse = {
  id: number;
  title: string;
  level: string;
  type: string;
  totalWords: number;
};

export type VocabularyStats = {
  totalLearning: number;
  dueForReview: number;
};

export type VocabularyProgress = {
  vocabId: number;
  courseId: number;
  createdAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  repetitions: number;
};

export type VocabularyEntry = {
  id: number;
  term: string;
  reading: string | null;
  meaning: string;
  example: string | null;
  level: string | null;
};

export type ReviewRating = 0 | 1 | 2 | 3;
export type VocabularyCourseDetail = VocabularyCourse & { entries: VocabularyEntry[] };

export const dueVocabularyKey = ['vocabulary', 'due'] as const;
export const vocabularyProgressKey = ['vocabulary', 'progress'] as const;

export const getVocabularyCatalog = async (page = 0, signal?: AbortSignal) => {
  const response = await api.get<ApiEnvelope<{ content: VocabularyCourse[]; totalElements: number }>>(
    `/api/v1/vocab/courses?page=${page}&size=20`, { signal },
  );
  return { courses: response.data.content ?? [], total: response.data.totalElements };
};

export const getVocabularyCourses = async () => (await getVocabularyCatalog()).courses;

export const getVocabularyStats = async () => {
  const response = await api.get<ApiEnvelope<VocabularyStats>>('/api/v1/vocab/stats');
  return response.data;
};

export const getVocabularyProgress = async (signal?: AbortSignal) =>
  (await api.get<ApiEnvelope<VocabularyProgress[]>>('/api/v1/vocab/progress', { signal })).data;

export const getVocabularyCourse = async (id: number, signal?: AbortSignal) =>
  (await api.get<ApiEnvelope<VocabularyCourseDetail>>(`/api/v1/vocab/courses/${id}`, { signal })).data;

export const getDueVocabulary = async (signal?: AbortSignal) =>
  (await api.get<ApiEnvelope<VocabularyEntry[]>>('/api/v1/vocab/review?limit=50', { signal })).data;

export const submitVocabularyReview = async (vocabId: number, rating: ReviewRating) =>
  (await api.post<ApiEnvelope<{ vocabId: number; nextReviewAt: string }>>('/api/v1/vocab/review', { vocabId, rating })).data;
