import {
  getRecordingPermissionsAsync, RecordingPresets, requestRecordingPermissionsAsync,
  setAudioModeAsync, useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PronunciationResult } from '@/integrations/ai/ai-client';
import { describeVoiceError, predictSpeech } from '@/features/practice/services/voice-service.native';

// The platform scores at most 30 s of audio.
const MAX_RECORDING_MS = 25_000;

const discard = (uri: string | null) => {
  if (!uri) return;
  try { new File(uri).delete(); } catch { /* The device can evict cached recordings. */ }
};

export type LineScore = { line: number; result: PronunciationResult };

/** Records the learner repeating one caption line and has the AI platform score it. */
export function useLineRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { isRecording } = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState<Record<number, PronunciationResult>>({});
  const target = useRef<{ line: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      request.current?.abort();
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    };
  }, []);

  const stop = useCallback(async () => {
    const current = target.current;
    if (!current) return;
    target.current = null;
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false });
      if (!uri || !alive.current) return;
      const controller = new AbortController();
      request.current = controller;
      const prediction = await predictSpeech(uri, controller.signal, current.text, current.text);
      if (!alive.current) return;
      if (prediction.pronunciation) {
        const result = prediction.pronunciation;
        setScores((previous) => ({ ...previous, [current.line]: result }));
      } else {
        setMessage('Dịch vụ giọng nói hiện tại không chấm phát âm.');
      }
    } catch (error) {
      if (__DEV__) console.warn('[youtube] scoring failed:', error);
      if (alive.current) setMessage(describeVoiceError(error) ?? 'Chưa chấm được bản ghi. Hãy thử lại.');
    } finally {
      discard(uri);
      request.current = null;
      if (alive.current) setBusy(false);
    }
  }, [recorder]);

  const start = useCallback(async (line: number, text: string) => {
    if (target.current || busy) return;
    setMessage('');
    try {
      const permission = await getRecordingPermissionsAsync();
      if (!permission.granted && !(await requestRecordingPermissionsAsync()).granted) {
        setMessage('Cần quyền micro để ghi âm. Bạn có thể bật quyền trong cài đặt thiết bị.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!alive.current) return;
      target.current = { line, text };
      recorder.record();
      timer.current = setTimeout(() => void stop(), MAX_RECORDING_MS);
    } catch (error) {
      if (__DEV__) console.warn('[youtube] recording failed:', error);
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      if (alive.current) setMessage('Không thể ghi âm lúc này.');
    }
  }, [busy, recorder, stop]);

  return { isRecording, busy, message, scores, start, stop };
}
