import { fetch as streamingFetch } from 'expo/fetch';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { readingExerciseSchema, type ReadingGeneration, type StudyLevel } from '@/features/reading/data/reading-schema';
import { api, apiResponse } from '@/integrations/api/api-client';
import type { ApiEnvelope } from '@/shared/types/api';

export { studyLevels } from '@/features/reading/data/reading-schema';
export type { ReadingExercise, StudyLevel } from '@/features/reading/data/reading-schema';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

const annotationsSchema = z.object({
  items: z.array(z.object({ line: z.string(), romaji: z.string(), translation: z.string() })),
});
const wordSchema = z.object({
  word: z.string(), reading: z.string(), meaningVi: z.string(), exampleJa: z.string(), exampleVi: z.string(),
});
export async function generateReadingExercise(proficiencyLevel: StudyLevel, signal?: AbortSignal, settings?: ReadingGeneration) {
  const response = await api.post<ApiEnvelope<unknown>>('/api/v1/practice/reading/generate', { proficiencyLevel, ...settings }, { signal });
  const exercise = readingExerciseSchema.parse(response.data);
  if (settings && (exercise.level !== proficiencyLevel || exercise.questions.length !== settings.questionCount
    || exercise.generation?.topic !== settings.topic || exercise.generation?.length !== settings.length)) {
    throw new Error('Reading settings not supported');
  }
  return exercise;
}

export async function annotateReadingLines(lines: string[]) {
  const response = await api.post<ApiEnvelope<unknown>>('/api/v1/practice/reading/annotate', { lines });
  return annotationsSchema.parse(response.data).items;
}

export async function explainReadingWord(word: string, context: string) {
  const response = await api.post<ApiEnvelope<unknown>>('/api/v1/practice/reading/word', { word, context });
  return wordSchema.parse(response.data);
}

export async function streamPracticeChat(message: string, level: StudyLevel, history: ChatTurn[],
  signal: AbortSignal, onChunk: (text: string) => void, options: { scenario?: string; includeTranslation?: boolean } = {}) {
  if (env.demoMode) {
    if (signal.aborted) return;
    const responses = [
      'こんにちは！お名前は何ですか？\nXin chào! Bạn tên là gì?',
      'はじめまして。どこから来ましたか？\nRất vui được gặp bạn. Bạn đến từ đâu?',
      '日本語を勉強していますか？\nBạn đang học tiếng Nhật phải không?',
      '今日は何をしましたか？\nHôm nay bạn đã làm gì?',
    ];
    const turn = history.filter(({ role }) => role === 'assistant').length + (level !== 'N5' ? 2 : 0);
    onChunk(responses[turn % responses.length]);
    return;
  }
  const response = await apiResponse('/api/v1/practice/chat', {
    method: 'POST', body: { message, settings: { proficiencyLevel: level, speechRate: 100, ...options }, history },
    signal, headers: { Accept: 'text/event-stream, application/json' },
  }, (url, options) => streamingFetch(url, options));
  if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream')) {
    throw new Error('Missing chat stream');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let receivedText = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      const lines = (pending + (done ? decoder.decode() + '\n' : decoder.decode(value, { stream: true }))).split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trimEnd();
        if (data === '[DONE]' && receivedText) return;
        if (data === '[DONE]' || data === '[ERROR]') throw new Error('Chat did not return a complete response');
        const chunk = z.string().parse(JSON.parse(data));
        receivedText ||= Boolean(chunk.trim());
        onChunk(chunk);
      }
      if (done) throw new Error('Chat stream ended before completion');
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
