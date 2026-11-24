import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { deviceStorage } from '@/shared/utils/device-storage';

const server = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (character) => character.codePointAt(0)!.toString(16)).join('.');
const bookmarkKey = (userId: number | undefined, item: string) => `miraigo.bookmark.${server}.${userId}.${item}`;

const demoSaved = new Set(['lesson.9100.9401', 'jlpt.9900', 'word.9701', 'word.9703', 'speaking.gioi-thieu']);
export async function readDeviceBookmark(userId: number, item: string) {
  const stored = await deviceStorage.get(bookmarkKey(userId, item));
  return stored === 'saved' || (stored == null && env.demoMode && demoSaved.has(item));
}

export function useDeviceBookmark(item: string) {
  const userId = useCurrentUser().data?.id;
  const storageKey = bookmarkKey(userId, item);
  const queryKey = ['bookmark', storageKey] as const;
  const bookmark = useQuery({
    queryKey,
    enabled: userId !== undefined,
    queryFn: () => userId === undefined ? false : readDeviceBookmark(userId, item),
    staleTime: Infinity,
  });
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: async (saved: boolean) => {
      await deviceStorage.set(storageKey, saved ? 'saved' : 'removed');
      return { storageKey, saved };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['bookmark', result.storageKey], result.saved);
      if (item.startsWith('word.')) void queryClient.invalidateQueries({ queryKey: ['vocabulary', 'favorites', userId] });
    },
  });

  return {
    saved: bookmark.data === true,
    enabled: userId !== undefined && bookmark.isSuccess && !save.isPending,
    failed: bookmark.isError || save.isError,
    userId,
    toggle: () => save.mutate(!bookmark.data),
  };
}
