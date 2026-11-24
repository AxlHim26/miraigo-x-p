import { grammarDeckSchema, type GrammarKind } from '@/features/grammar/data/grammar-exercises';
import type { GrammarLevel, GrammarPoint } from '@/features/grammar/types/catalog';
import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export async function generateGrammarDeck(level: GrammarLevel['level'], point: GrammarPoint, type: GrammarKind, questionCount: number, signal: AbortSignal) {
  const response = await api.post<ApiEnvelope<unknown>>('/api/v1/practice/grammar/generate', {
    level, topic: point.title, structure: point.structure, type, questionCount,
  }, { signal });
  const deck = grammarDeckSchema.parse(response.data);
  if (deck.questions.length !== questionCount || deck.questions.some((question) => question.type !== type)) {
    throw new Error('Generated grammar exercise does not match the request');
  }
  return deck.questions;
}
