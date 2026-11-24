import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export type Point = { x: number; y: number };
export type KanjiMap = {
  glyph: string;
  radical: string | null;
  parts: string[];
  strokeOrderGif: string | null;
  related: { glyph: string; sameRadical: boolean; sharedParts: string[] }[];
};

export async function getKanjiMap(glyph: string, signal?: AbortSignal) {
  return (await api.get<ApiEnvelope<KanjiMap>>(`/api/v1/kanji/${encodeURIComponent(glyph)}/map`, { signal })).data;
}

export async function recognizeKanji(strokes: Point[][]) {
  return (await api.post<ApiEnvelope<string[]>>('/api/v1/kanji/handwriting', { strokes })).data;
}
