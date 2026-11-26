import { useQuery } from '@tanstack/react-query';

import { getAiClient } from '@/integrations/ai/app-client';
import { AiError } from '@/integrations/ai/ai-client';

async function requireClient() {
  const client = await getAiClient();
  if (!client) throw new AiError('The AI platform is not configured', 0, 'NOT_CONFIGURED');
  return client;
}

export const useChannels = () =>
  useQuery({
    queryKey: ['youtube', 'channels'],
    queryFn: async ({ signal }) => (await requireClient()).youtubeChannels({ signal }),
    staleTime: 60 * 60_000,
    retry: 1,
  });

export const useChannelVideos = (channelId: string | undefined) =>
  useQuery({
    queryKey: ['youtube', 'channel-videos', channelId],
    queryFn: async ({ signal }) => (await requireClient()).youtubeChannelVideos(channelId!, { signal }),
    enabled: !!channelId,
    staleTime: 10 * 60_000,
    retry: 1,
  });

export const useCaptions = (videoId: string) =>
  useQuery({
    queryKey: ['youtube', 'captions', videoId],
    queryFn: async ({ signal }) => (await requireClient()).youtubeCaptions(videoId, { signal }),
    staleTime: 60 * 60_000,
    retry: false,
  });

/** Reading of one caption line. Rows request it only while they are on screen; results are cached. */
export const useFurigana = (text: string, enabled: boolean) =>
  useQuery({
    queryKey: ['youtube', 'analysis', text],
    queryFn: async ({ signal }) => (await requireClient()).analyze(text, 'C', { signal }),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
