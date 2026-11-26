import type { PronunciationResult } from '@/integrations/ai/ai-client';

type Word = PronunciationResult['words'][number];
type Issue = Word['issues'][number];

const quote = (value: string | null) => (value ? `「${value}」` : '');

// Issue types come from the AI platform (services/pronunciation/scoring.py). Unknown types fall back
// to the platform's English message, so a newer platform never breaks the screen.
const messages: Record<string, (issue: Issue) => string> = {
  long_vowel_shortened: () => 'Âm kéo dài bị đọc ngắn. Hãy giữ thêm một phách.',
  vowel_lengthened: () => 'Nguyên âm bị kéo quá dài. Chỉ giữ một phách.',
  sokuon_missing: () => 'Thiếu quãng ngắt っ. Ngừng ngắn trước phụ âm tiếp theo.',
  sokuon_added: () => 'Thừa quãng ngắt っ.',
  n_missing: () => 'Thiếu âm ん.',
  n_added: () => 'Thừa âm ん.',
  voicing: (i) => `Đọc sai âm đục/trong: cần ${quote(i.expected)}, nghe ${quote(i.heard)}.`,
  youon: (i) => `Đọc sai âm ghép: cần ${quote(i.expected)}, nghe ${quote(i.heard)}.`,
  vowel: (i) => `Đọc sai nguyên âm: cần ${quote(i.expected)}, nghe ${quote(i.heard)}.`,
  consonant: (i) => `Đọc sai phụ âm: cần ${quote(i.expected)}, nghe ${quote(i.heard)}.`,
  mismatch: (i) => `Cần ${quote(i.expected)}, nghe ${quote(i.heard)}.`,
  omitted: (i) => `Không nghe thấy ${quote(i.expected)}.`,
  extra_sound: (i) => `Nghe thừa âm ${quote(i.heard)}.`,
};

export const describeIssue = (issue: Issue) => messages[issue.type]?.(issue) ?? issue.message;

export type WordFeedback = { word: string; missed: boolean; notes: string[] };

/** Words that were not read cleanly, with Vietnamese notes. Clean words are omitted. */
export const pronunciationFeedback = (result: PronunciationResult): WordFeedback[] =>
  result.words
    .filter((word) => word.status !== 'ok')
    .map((word) => ({ word: word.text, missed: word.status === 'missed', notes: word.issues.map(describeIssue) }));
