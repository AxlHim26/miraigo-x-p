import { grammarLevels } from '@/features/grammar/data/catalog';
import { allKanji, findKanji } from '@/features/kanji/data/catalog';
import { demoCourses, demoOrigin, demoUser } from '@/integrations/demo/demo-data';
import { initialJlpt, jlptRequest, type DemoJlptState } from '@/integrations/demo/demo-jlpt';
import { practiceRequest } from '@/integrations/demo/demo-practice';
import { initialVocabulary, vocabularyRequest, type DemoVocabularyState } from '@/integrations/demo/demo-vocabulary';
import type { ApiRequestOptions } from '@/shared/types/api';
import { ApiError } from '@/shared/utils/api-error';
import { createStudyStorage } from '@/shared/utils/study-storage';

const storage = createStudyStorage('miraigo-demo-api');
let pending = Promise.resolve();

async function transaction<T, R>(resource: string, initial: () => T, method: string, apply: (state: T) => R) {
  const result = pending.then(async () => {
    const previous = await storage.get(resource);
    const state = previous ? JSON.parse(previous) as T : initial();
    const data = apply(state);
    if (method !== 'GET') await storage.set(resource, JSON.stringify(state));
    return data;
  });
  pending = result.then(() => undefined, () => undefined);
  return result;
}

export async function demoResponse(path: string, options: ApiRequestOptions) {
  if (options.signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
  const url = new URL(path, demoOrigin);
  const route = url.pathname.match(/^\/api\/v1\/([^/]+)(?:\/(.+))?$/);
  if (url.origin !== demoOrigin || !route) throw new ApiError('Địa chỉ này không dùng dữ liệu demo.', 404);
  const [, resource, rest] = route;
  const parts = rest?.split('/').map(decodeURIComponent) ?? [];
  const method = options.method ?? 'GET';
  let data: unknown;
  switch (resource) {
    case 'users':
      if (parts[0] === 'me') data = demoUser;
      break;
    case 'auth':
      if (parts[0] === 'logout') data = null;
      if (parts[0] === 'authenticate') data = { token: 'mirai-demo-session' };
      if (parts.join('/') === 'verification/confirm') {
        if ((options.body as { token: string }).token !== 'MIRAIGO') throw new ApiError('Mã xác minh demo không đúng.', 400);
        data = { token: 'mirai-demo-session' };
      }
      if (parts[0] === 'register' || parts.join('/') === 'verification/resend') {
        data = { email: (options.body as { email: string }).email, expiresInMinutes: 30 };
      }
      break;
    case 'courses':
      data = parts.length ? demoCourses.find((course) => course.id === Number(parts[0])) : demoCourses;
      break;
    case 'grammar-books':
      data = grammarLevels.map((level, index) => ({
        id: index + 1, isActive: true, title: level.title, name: level.title, level: level.level, chapterCount: level.lessonCount, description: level.source,
      }));
      break;
    case 'vocab':
      data = await transaction<DemoVocabularyState, unknown>('vocab-v1', initialVocabulary, method,
        (state) => vocabularyRequest(state, parts, url.searchParams, method, options.body));
      break;
    case 'jlpt':
      data = await transaction<DemoJlptState, unknown>('jlpt-v1', initialJlpt, method,
        (state) => jlptRequest(state, parts, url.searchParams, method, options.body));
      break;
    case 'kanji':
      if (parts[0] === 'handwriting') {
        const { strokes } = options.body as { strokes: unknown[] };
        const matching = allKanji.filter(({ row }) => row[4] === strokes.length).slice(0, 8).map(({ row }) => row[0]);
        data = matching.length ? matching : ['日', '月', '学', '本'];
      } else if (parts[1] === 'map') {
        const radical = findKanji(parts[0])?.row[5] ?? null;
        data = { glyph: parts[0], radical, parts: radical ? [radical] : [], strokeOrderGif: null,
          related: allKanji.filter(({ row }) => row[0] !== parts[0] && row[5] === radical).slice(0, 8)
            .map(({ row }) => ({ glyph: row[0], sameRadical: true, sharedParts: [row[5]] })) };
      }
      break;
    case 'practice':
      data = practiceRequest(parts, options.body);
      break;
  }
  if (data === undefined) {
    if (method === 'DELETE') return new Response(null, { status: 204 });
    throw new ApiError('Không tìm thấy dữ liệu mẫu.', 404);
  }
  return new Response(JSON.stringify({ status: 200, message: 'Dữ liệu demo', data }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
