import {
  getRecordingPermissionsAsync, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync,
  useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { env } from '@/core/config/env';
import { predictSpeech } from '@/features/practice/services/voice-service.native';
import { transcriptScore } from '@/features/practice/data/transcript-score';

const discard = (uri: string | null) => {
  if (uri) try { new File(uri).delete(); } catch { /* The cache may already be cleared. */ }
};

export function useSpeakingRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const pending = useRef(false);
  const clip = useRef<string[]>([]);
  const request = useRef<AbortController | null>(null);
  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
      clip.current.forEach(discard);
      clip.current = [];
      if (recorder.isRecording) void recorder.stop().then(() => discard(recorder.uri), () => undefined)
        .finally(() => setAudioModeAsync({ allowsRecording: false }).catch(() => undefined));
    };
  }, [recorder]));

  async function toggle(reference: string, onResult: (result: { text: string; score: number; uri: string }) => void) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (recorder.isRecording) {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error('Missing recording');
        if (!active.current) { discard(uri); return; }
        clip.current.push(uri);
        await setAudioModeAsync({ allowsRecording: false });
        const controller = new AbortController();
        request.current = controller;
        const timeout = setTimeout(() => controller.abort(), 45_000);
        try {
          const result = await predictSpeech(uri, controller.signal, reference);
          if (active.current && !controller.signal.aborted) onResult({
            text: result.transcript, score: env.demoMode ? 87 + reference.length % 9 : transcriptScore(reference, result.transcript), uri,
          });
        } finally {
          clearTimeout(timeout);
          request.current = null;
        }
      } else {
        const permission = await getRecordingPermissionsAsync();
        if (!permission.granted && !(await requestRecordingPermissionsAsync()).granted) {
          setError('Cần quyền micro để luyện nói.');
          return;
        }
        if (!active.current) return;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (active.current) recorder.record();
        else {
          await recorder.stop().catch(() => undefined);
          discard(recorder.uri);
          await setAudioModeAsync({ allowsRecording: false });
        }
      }
    } catch {
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      if (active.current) setError('Chưa đọc được bản ghi âm. Hãy thử lại hoặc kiểm tra dịch vụ nhận diện giọng nói.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { isRecording: state.isRecording, seconds: Math.floor(state.durationMillis / 1000), busy, error, toggle };
}
