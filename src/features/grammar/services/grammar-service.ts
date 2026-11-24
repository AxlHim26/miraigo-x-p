import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export type GrammarBook = {
  id: number;
  title: string;
  level: string;
  isActive: boolean;
};

export const getGrammarBooks = async () => {
  const response = await api.get<ApiEnvelope<GrammarBook[]>>('/api/v1/grammar-books');
  return response.data;
};
