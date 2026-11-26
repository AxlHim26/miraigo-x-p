import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { z } from 'zod';

import { env } from '@/core/config/env';
import type { PronunciationResult } from '@/integrations/ai/ai-client';
import { getAiClient } from '@/integrations/ai/app-client';
import { describeVoiceError } from '@/features/practice/services/voice-errors';
import { getVoiceOrigin } from '@/features/practice/services/voice-origin';

const prediction = z.object({ language: z.string(), confidence: z.number(), transcript: z.string() });
export type VoicePrediction = {
  language: string;
  /** Only the legacy voice service reports a confidence. */
  confidence?: number;
  transcript: string;
  /** Present when the AI platform scored the recording against a reference sentence. */
  pronunciation?: PronunciationResult;
};

/** expo/fetch only accepts expo-file-system `File` parts in FormData (not `{ uri, name, type }`). */
const toAiFile = (uri: string) => new File(uri);


export { getVoiceOrigin } from '@/features/practice/services/voice-origin';
export { describeVoiceError };

async function submitAudio(path: '/predict' | '/predict-stream', uri: string, signal: AbortSignal) {
  const origin = getVoiceOrigin();
  if (!origin) throw new Error('Voice service is unavailable');
  const file = new File(uri);
  const body = new FormData();
  body.append('audio', file);
  const response = await fetch(new URL(path, origin), { method: 'POST', body, signal });
  if (!response.ok) throw new Error(`Voice service returned ${response.status}`);
  return response;
}

export async function predictSpeech(
  uri: string,
  signal: AbortSignal,
  demoTranscript = 'こんにちは。日本語を勉強しています。',
  referenceText?: string,
): Promise<VoicePrediction> {
  if (env.demoMode) return { language: 'ja', confidence: 0.89, transcript: demoTranscript };
  const ai = await getAiClient();
  if (ai) {
    const file = toAiFile(uri);
    if (referenceText) {
      const pronunciation = await ai.evaluatePronunciation(file, referenceText, { signal });
      return { language: 'ja', transcript: pronunciation.recognizedText, pronunciation };
    }
    const result = await ai.transcribe(file, { signal });
    return { language: result.language ?? 'ja', transcript: result.text };
  }
  return prediction.parse(await (await submitAudio('/predict', uri, signal)).json());
}

const streamEvent = z.object({
  step: z.enum(['convert', 'transcribing', 'chunk_done', 'done', 'error']),
  progress: z.number().optional(),
  text: z.string().optional(),
  language: z.string().optional(),
  transcript: z.string().optional(),
});

export async function transcribeSpeech(uri: string, signal: AbortSignal, onProgress: (percent: number) => void) {
  if (env.demoMode) {
    onProgress(100);
    return 'こんにちは。日本語を勉強しています。';
  }
  const ai = await getAiClient();
  if (ai) {
    // The platform transcribes synchronously (no progress events); report completion only.
    onProgress(0);
    const result = await ai.transcribe(toAiFile(uri), { signal });
    onProgress(100);
    return result.text;
  }
  const response = await submitAudio('/predict-stream', uri, signal);
  if (!response.body) throw new Error('Missing transcription stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  const chunks: string[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();
      const lines = (pending + (done ? decoder.decode() + '\n' : decoder.decode(value, { stream: true }))).split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const event = streamEvent.parse(JSON.parse(line.slice(5)));
        if (event.step === 'error') throw new Error('Transcription failed');
        if (event.progress != null) onProgress(Math.max(0, Math.min(100, event.progress)));
        if (event.step === 'chunk_done' && event.text) {
          chunks.push(event.language ? `[${event.language.toUpperCase()}] ${event.text}` : event.text);
        }
        if (event.step === 'done') {
          onProgress(100);
          return chunks.length > 0 ? chunks.join('\n') : (event.transcript ?? '');
        }
      }
      if (done) throw new Error('Transcription ended before completion');
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
