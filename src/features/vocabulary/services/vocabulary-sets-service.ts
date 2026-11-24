import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export const vocabularyLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type SetInput = {
  title: string;
  description?: string;
  level?: (typeof vocabularyLevels)[number];
  isCommunity: boolean;
};
export type VocabularySet = SetInput & {
  id: string;
  wordCount: number;
  updatedAt: string;
  canEdit: boolean;
};
export type WordInput = {
  japanese: string;
  reading: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
};
export type VocabularySetWord = WordInput & { id: string };

export const setsKey = ['vocabulary-sets'] as const;
const setsPath = '/api/v1/vocab/sets';
const setPath = (id: string) => `${setsPath}/${encodeURIComponent(id)}`;
const wordsPath = (id: string) => `${setPath(id)}/words`;
const wordPath = (id: string, word: string) => `${wordsPath(id)}/${encodeURIComponent(word)}`;

export async function listVocabularySets(community: boolean, signal?: AbortSignal) {
  return (await api.get<ApiEnvelope<VocabularySet[]>>(`${setsPath}?community=${community}`, { signal })).data;
}
export async function getVocabularySet(id: string, signal?: AbortSignal) {
  return (await api.get<ApiEnvelope<VocabularySet>>(setPath(id), { signal })).data;
}
export async function createVocabularySet(data: SetInput) {
  return (await api.post<ApiEnvelope<VocabularySet>>(setsPath, data)).data;
}
export async function updateVocabularySet(id: string, data: SetInput) {
  return (await api.put<ApiEnvelope<VocabularySet>>(setPath(id), data)).data;
}
export async function copyVocabularySet(id: string) {
  return (await api.post<ApiEnvelope<VocabularySet>>(`${setPath(id)}/copy`)).data;
}
export function deleteVocabularySet(id: string) {
  return api.delete<void>(setPath(id));
}
export async function getVocabularySetWords(id: string, signal?: AbortSignal) {
  return (await api.get<ApiEnvelope<VocabularySetWord[]>>(wordsPath(id), { signal })).data;
}
export function createVocabularySetWord(id: string, data: WordInput) {
  return api.post<ApiEnvelope<VocabularySetWord>>(wordsPath(id), data);
}
export function updateVocabularySetWord(id: string, word: string, data: WordInput) {
  return api.put<ApiEnvelope<VocabularySetWord>>(wordPath(id, word), data);
}
export function deleteVocabularySetWord(id: string, word: string) {
  return api.delete<void>(wordPath(id, word));
}
