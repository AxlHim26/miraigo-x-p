import { AiError } from '@/integrations/ai/ai-client';

const aiMessages: Record<string, string> = {
  AI_AUDIO_TOO_LONG: 'Bản ghi quá dài (tối đa 2 phút; 30 giây khi chấm phát âm).',
  AI_AUDIO_EMPTY: 'Không nghe thấy tiếng nói. Hãy ghi âm lại.',
  AI_AUDIO_INVALID: 'Không đọc được tệp âm thanh này.',
  AI_FILE_TOO_LARGE: 'Tệp quá lớn (tối đa 25 MB).',
  AI_AUTH_INVALID: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  AI_AUTH_REQUIRED: 'Cần đăng nhập để dùng tính năng này.',
  AI_TEXT_NOT_JAPANESE: 'Câu này không có chữ tiếng Nhật để chấm.',
  AI_FEATURE_DISABLED: 'Máy chủ AI đang tắt tính năng phụ đề YouTube.',
  AI_CAPTIONS_NOT_FOUND: 'Video này không có phụ đề tiếng Nhật.',
  AI_VIDEO_UNAVAILABLE: 'Video không xem được (riêng tư, đã xóa hoặc bị giới hạn).',
  AI_CAPTIONS_BLOCKED: 'YouTube đang chặn việc lấy phụ đề. Hãy thử lại sau.',
};

/** A user-facing message for AI platform errors, or `null` to let the caller use its generic fallback. */
export function describeVoiceError(error: unknown): string | null {
  return error instanceof AiError && error.errorCode ? aiMessages[error.errorCode] ?? null : null;
}
