import { z } from 'zod';

import { env } from '@/core/config/env';
import type { AiLevel } from '@/features/ai/ai-catalog';
import { api } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

const correctionSchema = z.object({
  corrected: z.string().trim().min(1).max(450),
  natural: z.string().trim().min(1).max(450),
  explanation: z.string().trim().min(1).max(650),
  translation: z.string().trim().min(1).max(450),
});
export type AiCorrection = z.infer<typeof correctionSchema>;

export async function getAiCorrection(text: string, level: AiLevel, signal?: AbortSignal): Promise<AiCorrection> {
  const message = text.trim().slice(0, 450);
  if (env.demoMode) {
    if (/グエン/.test(message)) return {
      corrected: 'わたしはグエンです。', natural: 'グエンといいます。',
      explanation: 'Viết liền trợ từ は với chủ đề. Dùng といいます khi muốn giới thiệu tên tự nhiên hơn.',
      translation: 'Tôi tên là Nguyễn.',
    };
    if (/いくら/.test(message)) return {
      corrected: 'これはいくらですか？', natural: 'こちらはおいくらですか？',
      explanation: 'こちら và おいくら tạo sắc thái lịch sự khi hỏi giá tại cửa hàng.',
      translation: 'Món này bao nhiêu tiền ạ?',
    };
    return {
      corrected: message, natural: message,
      explanation: 'Gợi ý demo áp dụng cho bài giới thiệu bản thân và câu hỏi giá.',
      translation: 'Bản dịch mẫu hiện có cho những tình huống đã chuẩn bị.',
    };
  }
  const response = await api.post<ApiEnvelope<AiCorrection>>('/api/v1/practice/chat/correct', { message, level }, { signal });
  return correctionSchema.parse(response.data);
}

export function correctionOptions(text: string, level: AiLevel) {
  return { queryKey: ['ai-correction', text, level], queryFn: ({ signal }: { signal: AbortSignal }) => getAiCorrection(text, level, signal),
    staleTime: 5 * 60_000, retry: false };
}
