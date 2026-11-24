import { env, getServiceOrigin } from '@/core/config/env';

export const webTools = {
  vocabulary: {
    title: 'Bộ từ vựng cá nhân và cộng đồng',
    items: [
      { label: 'Bộ từ của tôi · tạo, sửa và thêm từ', path: '/vocabulary' },
      { label: 'Bộ từ cộng đồng', path: '/vocabulary/community' },
    ],
  },
  kanji: {
    title: 'Công cụ Hán tự',
    items: [
      { label: 'Kanji Map', path: '/kanji-map' },
      { label: 'Tra cứu bằng chữ viết tay', path: '/kanji-map/lookup' },
    ],
  },
  practice: {
    title: 'Luyện tập kỹ năng',
    items: [
      { label: 'Luyện phát âm', path: '/practice/pronunciation' },
      { label: 'Shadowing', path: '/practice/shadowing' },
      { label: 'Nghe và chép chính tả', path: '/practice/transcribe' },
      { label: 'Thử thách 50 ngày', path: '/practice/challenge' },
    ],
  },
  jlpt: {
    title: 'Đề thi cộng đồng',
    items: [
      { label: 'Tạo đề cộng đồng', path: '/practice/jlpt/create-exam' },
    ],
  },
} as const;

export type WebToolGroup = keyof typeof webTools;

export function findWebTool(path: string | undefined) {
  return Object.values(webTools).flatMap((group) => [...group.items]).find((item) => item.path === path);
}

export function resolveFrontendUrl(path: string, base = env.frontendBaseUrl, allowLocalHttp = env.appEnv === 'development') {
  if (!/^\/[\w-]+(?:\/[\w-]+)*$/.test(path)) return null;
  const origin = getServiceOrigin(base, allowLocalHttp);
  return origin ? new URL(path, origin).href : null;
}
