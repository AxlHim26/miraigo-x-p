import { z } from 'zod';

import { JlptAttemptResultSchema, JlptExamDetailSchema, JlptPracticeQuestionResponseSchema, JlptSectionAttemptSchema, JlptStartAttemptResponseSchema, type JlptAttemptAnswer } from '@/features/practice/types/jlpt-schema';
import { api, apiRequest } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export type JlptExam = {
  id: number;
  code: string;
  title: string;
  level: string;
  examYear: number;
  examMonth: number;
  totalDurationMinutes: number;
};

export const getPublishedExams = async () => {
  const response = await api.get<ApiEnvelope<JlptExam[]>>('/api/v1/jlpt/exams');
  return response.data;
};

export const getJlptExam = async (id: number, signal?: AbortSignal) =>
  JlptExamDetailSchema.parse((await api.get<ApiEnvelope<unknown>>(`/api/v1/jlpt/exams/${id}`, { signal })).data);

export const startJlptAttempt = async (examId: number) =>
  JlptStartAttemptResponseSchema.parse((await api.post<ApiEnvelope<unknown>>(`/api/v1/jlpt/exams/${examId}/attempts`)).data);

export const getJlptAttempt = async (id: number, signal?: AbortSignal) =>
  JlptStartAttemptResponseSchema.parse((await api.get<ApiEnvelope<unknown>>(`/api/v1/jlpt/attempts/${id}`, { signal })).data);

export const updateJlptSection = async (attemptId: number, sectionId: number, action: 'start' | 'submit') =>
  JlptSectionAttemptSchema.parse((await api.post<ApiEnvelope<unknown>>(`/api/v1/jlpt/attempts/${attemptId}/sections/${sectionId}/${action}`)).data);

export const saveJlptAnswer = async (id: number, answer: JlptAttemptAnswer) =>
  (await apiRequest<ApiEnvelope<{ attemptId: number; savedCount: number }>>(`/api/v1/jlpt/attempts/${id}/answers`, {
    method: 'PATCH',
    body: { answers: [answer] },
  })).data;

export const submitJlptAttempt = async (id: number) =>
  (await api.post<ApiEnvelope<{ attemptId: number }>>(`/api/v1/jlpt/attempts/${id}/submit`)).data;

export const getJlptResult = async (id: number, signal?: AbortSignal) =>
  JlptAttemptResultSchema.parse((await api.get<ApiEnvelope<unknown>>(`/api/v1/jlpt/attempts/${id}/result`, { signal })).data);

export type JlptAttemptHistoryItem = {
  attemptId: number;
  examId: number;
  examTitle: string;
  level: string;
  status: string;
  totalScaledScore: number | null;
};

export const getJlptHistory = async (signal?: AbortSignal) =>
  (await api.get<ApiEnvelope<JlptAttemptHistoryItem[]>>('/api/v1/jlpt/attempts/history', { signal })).data;

export async function getJlptQuestions(level: string, sectionType: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ level, sectionType, limit: '10' });
  const response = await api.get<ApiEnvelope<unknown>>(`/api/v1/jlpt/practice?${query}`, { signal });
  const questions = JlptPracticeQuestionResponseSchema.array().parse(response.data);
  return level === 'PLACEMENT' ? questions.filter((item) => item.options.length > 0 && item.correctOptionKey) : questions;
}

export async function evaluatePlacement(answers: JlptAttemptAnswer[]) {
  const response = await api.post<ApiEnvelope<unknown>>('/api/v1/jlpt/placement', { answers });
  return z.enum(['N5', 'N4', 'N3', 'N2', 'N1']).parse(response.data);
}
