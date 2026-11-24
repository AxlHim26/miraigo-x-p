import type { ReviewRating, VocabularyProgress } from '@/features/vocabulary/services/vocabulary-service';
import type { SetInput, VocabularySet, VocabularySetWord, WordInput } from '@/features/vocabulary/services/vocabulary-sets-service';
import { demoDate, demoVocabulary } from '@/integrations/demo/demo-data';
import { ApiError } from '@/shared/utils/api-error';

type DemoSet = VocabularySet & { words: VocabularySetWord[] };
export type DemoVocabularyState = { sets: DemoSet[]; progress: VocabularyProgress[]; nextId: number };

export function initialVocabulary(): DemoVocabularyState {
  const now = new Date().toISOString();
  const words = demoVocabulary[0].entries.slice(0, 5).map((entry) => ({
    id: String(entry.id), japanese: entry.term, reading: entry.reading ?? entry.term, meaning: entry.meaning,
  }));
  return {
    nextId: 100,
    sets: [
      { id: 'demo-personal', title: 'Từ mới mỗi ngày', description: 'Từ khóa trong bài giới thiệu bản thân', level: 'N5', isCommunity: false, canEdit: true, wordCount: words.length, words, updatedAt: now },
      { id: 'demo-community', title: 'Cùng học JLPT N5', description: 'Bộ từ chia sẻ mẫu', level: 'N5', isCommunity: true, canEdit: false, wordCount: words.length, words, updatedAt: now },
    ],
    progress: demoVocabulary[0].entries.slice(0, 4).map((word, index) => ({
      vocabId: word.id, courseId: demoVocabulary[0].id, repetitions: index + 1, createdAt: demoDate(index).toISOString(),
      lastReviewedAt: demoDate(index).toISOString(), nextReviewAt: demoDate(index < 2 ? 1 : -2).toISOString(),
    })),
  };
}

export function vocabularyRequest(state: DemoVocabularyState, parts: string[], query: URLSearchParams, method: string, body: unknown) {
  const [resource, id, child, wordId] = parts;
  if (resource === 'courses' && !id) {
    return { content: demoVocabulary.map(({ entries: _entries, ...course }) => ({ ...course, totalWords: _entries.length })), totalElements: demoVocabulary.length };
  }
  if (resource === 'courses') {
    const course = demoVocabulary.find((course) => course.id === Number(id));
    if (!course) throw new ApiError('Không có chủ đề này.', 404);
    return course;
  }
  const due = state.progress.filter((entry) => Date.parse(entry.nextReviewAt) <= Date.now());
  if (resource === 'stats') return { totalLearning: state.progress.length, dueForReview: due.length };
  if (resource === 'progress') return state.progress;
  if (resource === 'review' && method === 'GET') return demoVocabulary.flatMap((course) => course.entries).filter((entry) => due.some((value) => value.vocabId === entry.id));
  if (resource === 'review' && method === 'POST') {
    const { vocabId, rating } = body as { vocabId: number; rating: ReviewRating };
    const course = demoVocabulary.find((item) => item.entries.some((word) => word.id === vocabId));
    if (!course) throw new ApiError('Không tìm thấy từ.', 404);
    const previous = state.progress.find((entry) => entry.vocabId === vocabId);
    const nextReviewAt = demoDate(-[0, 1, 3, 7][rating]).toISOString();
    state.progress = state.progress.filter((entry) => entry.vocabId !== vocabId).concat({
      vocabId, courseId: course.id, nextReviewAt, repetitions: (previous?.repetitions ?? 0) + 1,
      createdAt: previous?.createdAt ?? new Date().toISOString(), lastReviewedAt: new Date().toISOString(),
    });
    return { vocabId, nextReviewAt };
  }
  if (resource !== 'sets') throw new ApiError('Tính năng này chưa có dữ liệu demo.', 404);
  if (!id && method === 'GET') return state.sets.filter((set) => query.get('community') === 'true' ? set.isCommunity : set.canEdit);
  if (!id && method === 'POST') return addSet(state, body as SetInput, []);
  const set = state.sets.find((item) => item.id === id);
  if (!set) throw new ApiError('Không tìm thấy bộ từ.', 404);
  if (child === 'copy' && method === 'POST') return addSet(state, { title: set.title + ' (bản sao)', description: set.description, level: set.level, isCommunity: false }, set.words.map((word) => ({ ...word })));
  if (method === 'GET') return child === 'words' ? set.words : set;
  if (!set.canEdit) throw new ApiError('Bộ từ này chỉ được xem hoặc sao chép.', 403);
  if (!child && method === 'DELETE') {
    state.sets = state.sets.filter((item) => item.id !== id);
    return undefined;
  }
  if (!child && method === 'PUT') return Object.assign(set, body as SetInput, { updatedAt: new Date().toISOString() });
  if (child !== 'words') throw new ApiError('Không tìm thấy thao tác.', 404);
  const existing = set.words.find((word) => word.id === wordId);
  if (wordId && !existing) throw new ApiError('Không tìm thấy từ.', 404);
  const word = { ...(body as WordInput), id: existing?.id ?? String(++state.nextId) };
  set.words = set.words.filter((item) => item !== existing);
  if (method !== 'DELETE') set.words.push(word);
  set.wordCount = set.words.length;
  set.updatedAt = new Date().toISOString();
  return method === 'DELETE' ? undefined : word;
}

function addSet(state: DemoVocabularyState, input: SetInput, words: VocabularySetWord[]) {
  const set: DemoSet = { ...input, id: 'demo-set-' + ++state.nextId, words, wordCount: words.length, canEdit: true, updatedAt: new Date().toISOString() };
  state.sets = [set, ...state.sets];
  return set;
}
