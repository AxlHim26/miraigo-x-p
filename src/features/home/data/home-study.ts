import type { Href } from 'expo-router';
import { studySymbol as symbol, type StudySymbol } from '@/components/ui/study-icon';

export const homeSymbols = {
  bell: symbol('bell', 'notifications'),
  flame: symbol('flame.fill', 'local_fire_department'),
  goal: symbol('scope', 'track_changes'),
  video: symbol('play.fill', 'play_arrow'),
  next: symbol('chevron.right', 'chevron_right'),
  vocabulary: symbol('book', 'menu_book'),
  listening: symbol('headphones', 'headphones'),
  speaking: symbol('mic', 'mic'),
  reading: symbol('book.pages', 'auto_stories'),
  flashcard: symbol('checkmark.square.fill', 'task_alt'),
  writing: symbol('pencil', 'edit'),
  check: symbol('checkmark', 'check'),
  library: symbol('square.3.layers.3d', 'layers'),
  review: symbol('star', 'star_outline'),
  down: symbol('chevron.down', 'expand_more'),
};

type Shortcut = { title: string; glyph: StudySymbol; href: Href };

export const shortcuts = [
  { title: 'Video', glyph: homeSymbols.video, href: '/courses' },
  { title: 'Từ vựng', glyph: homeSymbols.vocabulary, href: '/vocabulary' },
  { title: 'Ngữ pháp', glyph: homeSymbols.library, href: '/grammar' },
  { title: 'Luyện nghe', glyph: homeSymbols.listening, href: '/practice/listening' },
  { title: 'Luyện nói', glyph: homeSymbols.speaking, href: '/practice/speaking' },
  { title: 'Luyện đọc', glyph: homeSymbols.reading, href: '/practice/reading' },
  { title: 'Bài tập', glyph: homeSymbols.writing, href: '/practice' },
  { title: 'Ôn tập', glyph: homeSymbols.review, href: '/vocabulary/review' },
] as const satisfies readonly Shortcut[];

export const dailyExercises = [
  { id: 'vocabulary', title: 'Từ vựng', detail: 'Flashcard', glyph: homeSymbols.flashcard, href: '/practice/flashcard' },
  { id: 'listening', title: 'Luyện nghe', detail: 'Chọn nghĩa', glyph: homeSymbols.listening, href: { pathname: '/practice/listening/exercise', params: { mode: 'meaning', level: 'N5' } } },
  { id: 'grammar', title: 'Ngữ pháp', detail: 'Ôn mẫu câu', glyph: homeSymbols.writing, href: '/grammar' },
] as const satisfies readonly (Omit<Shortcut, 'glyph'> & { id: string; detail: string; glyph: StudySymbol })[];

export type DailyExercise = typeof dailyExercises[number]['id'];
