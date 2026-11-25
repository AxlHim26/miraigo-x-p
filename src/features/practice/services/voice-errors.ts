import { AiError } from '@/integrations/ai/ai-client';

const aiMessages: Record<string, string> = {
  AI_AUDIO_TOO_LONG: 'Bản ghi quá dài (tối đa 2 phút; 30 giây khi chấm phát âm).',
  AI_AUDIO_EMPTY: 'Không nghe thấy tiếng nói. Hãy ghi âm lại.',
  AI_AUDIO_INVALID: 'Không đọc được tệp âm thanh này.',
  AI_FILE_TOO_LARGE: 'Tệp quá lớn (tối đa 25 MB).',
  AI_AUTH_INVALID: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  AI_AUTH_REQUIRED: 'Cần đăng nhập để dùng tính năng này.',
};

/** A user-facing message for AI platform errors, or `null` to let the caller use its generic fallback. */
export function describeVoiceError(error: unknown): string | null {
  return error instanceof AiError && error.errorCode ? aiMessages[error.errorCode] ?? null : null;
}
