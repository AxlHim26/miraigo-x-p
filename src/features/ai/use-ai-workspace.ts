import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { aiLevels, chatTopics, favoriteTopics, scenarios, type ChatTopic } from '@/features/ai/ai-catalog';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { createStudyStorage } from '@/shared/utils/study-storage';

const settingsSchema = z.object({
  level: z.enum(aiLevels), topics: z.array(z.enum(favoriteTopics)).max(favoriteTopics.length),
  furigana: z.boolean(), translation: z.boolean(), autoCorrect: z.boolean(),
});
const messageSchema = z.object({ role: z.enum(['assistant', 'user']), content: z.string().max(5000) });
const callSchema = z.object({
  id: z.string(), duration: z.number().nonnegative(), title: z.string(), average: z.number().min(0).max(100),
  turns: z.number().int().nonnegative(), best: z.string(), tip: z.string(),
});
export type AiCall = z.infer<typeof callSchema>;
const threadSchema = z.object({
  id: z.string(), title: z.string(), level: z.enum(aiLevels), updatedAt: z.iso.datetime(), messages: z.array(messageSchema).max(60), calls: z.array(callSchema).max(6).optional(),
});
const workspaceSchema = z.object({ settings: settingsSchema, threads: z.array(threadSchema).max(40) });
export type AiSettings = z.infer<typeof settingsSchema>;
export type AiThread = z.infer<typeof threadSchema>;
type Workspace = z.infer<typeof workspaceSchema>;

const defaults: AiSettings = { level: 'N5', topics: ['Hội thoại hằng ngày'], furigana: true, translation: true, autoCorrect: true };
const storage = createStudyStorage('miraigo-ai-chat');
const backend = Array.from(env.apiBaseUrl, (char) => char.codePointAt(0)!.toString(16)).join('.');

export function callTime(seconds: number) {
  return [Math.floor(seconds / 60), seconds % 60].map((part) => String(part).padStart(2, '0')).join(':');
}

export function aiMessage(japanese: string, vietnamese: string) {
  return japanese + '\n\n' + vietnamese;
}

function sampleThreads(): AiThread[] {
  const order = ['shop', 'intro', 'weekend', 'direction', 'hobby'];
  return order.map((name, index) => {
    const topic = chatTopics.find((item) => item.id === name)!;
    const scene = scenarios.find((item) => item.id === name);
    const messages: AiThread['messages'] = [{ role: 'assistant', content: aiMessage(topic.opening.japanese, topic.opening.vietnamese) }];
    if (scene?.id === 'shop') {
      messages.push({ role: 'user', content: aiMessage('コンビニで買(か)い物(もの)する練習(れんしゅう)をしたいです。', 'Tôi muốn luyện mua sắm ở cửa hàng tiện lợi.') });
      messages.push({ role: 'assistant', content: aiMessage('いいですね！\nでは、コンビニでの会話(かいわ)をやってみましょう。', 'Tuyệt vời! Hãy thử đoạn hội thoại ở cửa hàng tiện lợi nhé.') });
    }
    if (scene?.id === 'intro') {
      messages.push({ role: 'user', content: 'はじめまして。\nわたし は グエン です。\nベトナムから来(き)ました。' });
      messages.push({ role: 'assistant', content: aiMessage('ありがとうございます！\n日本語(にほんご)がとてもお上手(じょうず)ですね。\nお仕事(しごと)は何(なに)をしていますか？', 'Cảm ơn bạn! Bạn nói tiếng Nhật rất tốt. Bạn làm công việc gì?') });
    }
    return { id: 'demo-ai-' + name, title: topic.title, level: topic.level,
      updatedAt: new Date(Date.now() - index * 62_000_000).toISOString(), messages };
  });
}

export function makeAiThread(settings: AiSettings, topic?: ChatTopic): AiThread {
  const now = new Date();
  return {
    id: 'chat-' + now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
    title: topic?.title ?? 'Cuộc trò chuyện mới', level: topic?.level ?? settings.level,
    updatedAt: now.toISOString(),
    messages: [{ role: 'assistant', content: topic ? aiMessage(topic.opening.japanese, topic.opening.vietnamese)
      : aiMessage('こんにちは！今日(きょう)は何(なに)について話(はな)しましょうか？', 'Xin chào! Hôm nay bạn muốn nói về chủ đề gì?') }],
  };
}

export function useAiWorkspace() {
  const user = useCurrentUser();
  const key = `chat.${env.demoMode ? 'demo' : 'v1'}.${backend}.${user.data?.id ?? 'guest'}`;
  const queryKey = ['ai-workspace', key];
  const cache = useQueryClient();
  const query = useQuery({
    queryKey, enabled: !user.isPending, staleTime: Infinity, retry: false,
    queryFn: async () => {
      const raw = await storage.get(key);
      return raw ? workspaceSchema.parse(JSON.parse(raw)) : { settings: defaults, threads: env.demoMode ? sampleThreads() : [] };
    },
  });
  const mutation = useMutation({
    scope: { id: key },
    mutationFn: async (reduce: (current: Workspace) => Workspace) => {
      const previous = cache.getQueryData<Workspace>(queryKey);
      if (!previous) throw new Error('AI workspace is not ready');
      const next = workspaceSchema.parse(reduce(previous));
      await storage.set(key, JSON.stringify(next));
      cache.setQueryData(queryKey, next);
    },
  });
  return { data: query.data, pending: query.isPending, error: query.error, retry: query.refetch, save: mutation.mutateAsync, saving: mutation.isPending };
}
