import {
  getRecordingPermissionsAsync, RecordingPresets, requestRecordingPermissionsAsync,
  setAudioModeAsync, useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { JapaneseSpeech } from '@/components/ui/japanese-speech';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel } from '@/components/ui/learner-glass';
import { StudyAudio } from '@/components/ui/study-audio';
import { pronunciationSentences } from '@/features/practice/data/pronunciation-data';
import { transcriptScore } from '@/features/practice/data/transcript-score';
import { shadowingSentences } from '@/features/practice/data/shadowing-data';
import { freeSpeakingTopics } from '@/features/speaking/lessons';
import { pronunciationFeedback } from '@/features/practice/services/pronunciation-feedback';
import { describeVoiceError, getVoiceOrigin, predictSpeech, transcribeSpeech, type VoicePrediction } from '@/features/practice/services/voice-service.native';

const titles = {
  pronunciation: 'Luyện phát âm',
  shadowing: 'Shadowing',
  transcribe: 'Phiên âm tệp ghi âm',
  conversation: 'Hội thoại',
} as const;
type VoiceMode = keyof typeof titles;

export default function VoicePracticeScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const selected = (Object.keys(titles) as VoiceMode[]).find((key) => key === mode);
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="Luyện tập" />
      <LearnerHeading title={selected ? titles[selected] : 'Luyện nói'} />
      {selected ? <VoiceExercise key={selected} mode={selected} /> : <ThemedText>Không tìm thấy bài luyện.</ThemedText>}
    </LearnerCanvas>
  );
}

export function ConversationScreen() {
  const { topic: name } = useLocalSearchParams<{ topic?: string }>();
  const topic = freeSpeakingTopics.find((item) => item.name === name);
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="Luyện tập" />
      <LearnerHeading title={topic?.name ?? 'Hội thoại'} description={topic?.prompt ?? 'Ghi âm từng lượt để nhận diện ngôn ngữ và xem lời thoại.'} />
      <VoiceExercise mode="conversation" />
    </LearnerCanvas>
  );
}

type RecordingTurn = VoicePrediction & { uri: string };

function discard(uri: string | null | undefined) {
  if (!uri) return;
  try { new File(uri).delete(); } catch { /* The device can evict cached recordings. */ }
}

function VoiceExercise({ mode }: { mode: VoiceMode }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [index, setIndex] = useState(0);
  const [clip, setClip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<VoicePrediction | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [turns, setTurns] = useState<RecordingTurn[]>([]);
  const recordedTurns = useRef<RecordingTurn[]>([]);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const action = useRef(false);
  const latestClip = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const sentences = mode === 'shadowing' ? shadowingSentences : pronunciationSentences;
  const conversational = mode === 'conversation';
  const sentence = mode === 'transcribe' || conversational ? undefined : sentences[index];
  const service = getVoiceOrigin();

  const storeClip = useCallback((uri: string | null) => {
    if (latestClip.current !== uri) discard(latestClip.current);
    latestClip.current = uri;
    setClip(uri);
    setResult(null);
    setTranscript(null);
    setProgress(null);
  }, []);

  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
      request.current?.abort();
      if (recorder.isRecording) {
        void recorder.stop().then(() => discard(recorder.uri), () => undefined)
          .finally(() => setAudioModeAsync({ allowsRecording: false }).catch(() => undefined));
      }
    };
  }, [recorder]));

  const clearConversation = useCallback(() => {
    for (const turn of recordedTurns.current) discard(turn.uri);
    recordedTurns.current = [];
    setTurns([]);
  }, []);
  const releaseClip = useCallback(() => { discard(latestClip.current); latestClip.current = null; }, []);
  useFocusEffect(useCallback(() => () => {
    releaseClip();
    clearConversation();
    setClip(null);
    setResult(null);
    setTranscript(null);
    setProgress(null);
  }, [clearConversation, releaseClip]));

  async function run(task: () => Promise<void>, fallback: string) {
    if (action.current) return;
    action.current = true;
    setBusy(true);
    setMessage('');
    try { await task(); } catch (error) {
      if (active.current) setMessage(describeVoiceError(error) ?? fallback);
    } finally {
      action.current = false;
      setBusy(false);
    }
  }

  async function toggleRecording() {
    if (recorder.isRecording) {
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
      await recorder.stop();
      const uri = recorder.uri;
      if (active.current) storeClip(uri);
      else discard(uri);
      await setAudioModeAsync({ allowsRecording: false });
      if (conversational && active.current && uri && service) await analyze(uri);
      return;
    }
    const permission = await getRecordingPermissionsAsync();
    if (!permission.granted && !(await requestRecordingPermissionsAsync()).granted) {
      setMessage('Cần quyền micro để ghi âm. Bạn có thể bật quyền trong cài đặt thiết bị.');
      return;
    }
    if (!active.current) return;
    await Speech.stop();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    try {
      await recorder.prepareToRecordAsync();
      if (!active.current) {
        await recorder.stop();
        discard(recorder.uri);
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      storeClip(null);
      recorder.record();
      if (conversational) {
        recordingTimer.current = setTimeout(() => {
          if (active.current && recorder.isRecording) void run(toggleRecording, 'Không phân tích được lượt nói.');
        }, 10_000);
      }
    } catch (error) {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      throw error;
    }
  }

  async function pickRecording() {
    const response = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'video/*'], copyToCacheDirectory: true });
    if (response.canceled) return;
    const asset = response.assets[0];
    if (asset && active.current) storeClip(asset.uri);
    else discard(asset?.uri);
  }

  async function analyze(uri: string) {
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), mode === 'transcribe' ? 600_000 : 120_000);
    try {
      if (mode === 'transcribe') {
        setProgress(0);
        setTranscript(null);
        const text = await transcribeSpeech(uri, controller.signal, (percent) => {
          if (active.current) setProgress(percent);
        });
        if (active.current) setTranscript(text);
        return;
      }
      const response = await predictSpeech(uri, controller.signal, sentence?.japanese, sentence?.japanese);
      if (!active.current) return;
      if (conversational) {
        if (latestClip.current === uri) latestClip.current = null;
        setClip(null);
        const next = [...recordedTurns.current, { ...response, uri }];
        recordedTurns.current = next;
        setTurns(next);
      } else {
        setResult(response);
      }
    } finally {
      request.current = null;
      clearTimeout(timeout);
    }
  }

  return (
    <>
      {conversational && turns.length > 0 && (
        <>
          <LearnerControl label="Xóa các lượt nói" disabled={busy || recorderState.isRecording} onPress={clearConversation} />
          {turns.map((turn) => (
            <LearnerPanel key={turn.uri}>
              <ThemedText type="smallBold">Ngôn ngữ {turn.language}</ThemedText>
              <ThemedText selectable>{turn.transcript || 'Không nhận diện được lời nói.'}</ThemedText>
              <StudyAudio url={turn.uri} />
            </LearnerPanel>
          ))}
        </>
      )}
      {sentence && (
        <LearnerPanel>
          <LearnerHeading eyebrow={`${sentence.level} · Câu ${index + 1}/${sentences.length}`} title={sentence.japanese} />
          <ThemedText>{sentence.romaji}</ThemedText>
          <ThemedText themeColor="textSecondary">{sentence.meaning}</ThemedText>
          <JapaneseSpeech text={'speakText' in sentence ? String(sentence.speakText) : sentence.japanese} />
          <LearnerControl label="Câu tiếp theo" disabled={busy || recorderState.isRecording} onPress={() => {
            storeClip(null); setMessage(''); setIndex((previous) => (previous + 1) % sentences.length);
          }} />
        </LearnerPanel>
      )}
      <LearnerPanel>
        <LearnerControl label={recorderState.isRecording ? 'Dừng ghi âm' : 'Ghi âm'} tone="accent" disabled={busy}
          onPress={() => void run(toggleRecording, 'Không thể ghi âm lúc này.')} />
        {mode === 'transcribe' && <LearnerControl label="Chọn tệp âm thanh hoặc video" disabled={busy || recorderState.isRecording}
          onPress={() => void run(pickRecording, 'Không đọc được tệp đã chọn.')} />}
        {clip && !recorderState.isRecording && (
          <>
            <StudyAudio url={clip} />
            <LearnerControl label={busy ? 'Đang xử lý…' : 'Gửi để phiên âm'} disabled={busy || !service}
              onPress={() => void run(() => analyze(clip), 'Chưa nhận được kết quả từ dịch vụ phiên âm. Hãy thử lại.')} />
          </>
        )}
        {!service && <ThemedText type="small" themeColor="textSecondary">Dịch vụ phiên âm chưa được cấu hình.</ThemedText>}
        {!!message && <ThemedText accessibilityLiveRegion="polite">{message}</ThemedText>}
        {busy && progress !== null && <ThemedText accessibilityLiveRegion="polite">Đang phiên âm {Math.round(progress)}%</ThemedText>}
      </LearnerPanel>
      {result && (
        <LearnerPanel>
          <ThemedText type="smallBold">Ngôn ngữ nhận diện: {result.language}</ThemedText>
          {sentence && !result.pronunciation && <ThemedText>Khớp với câu mẫu: {transcriptScore(sentence.japanese, result.transcript)}%</ThemedText>}
          <ThemedText selectable>{result.transcript || 'Không nhận diện được lời nói.'}</ThemedText>
        </LearnerPanel>
      )}
      {result?.pronunciation && (
        <LearnerPanel>
          <ThemedText type="smallBold">Điểm phát âm: {Math.round(result.pronunciation.scores.overall)}/100</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Độ chính xác {Math.round(result.pronunciation.scores.accuracy)}% · Đầy đủ {Math.round(result.pronunciation.scores.completeness)}%
          </ThemedText>
          {pronunciationFeedback(result.pronunciation).map((item, position) => (
            <ThemedText key={`${item.word}-${position}`}>
              {item.word}: {item.notes.length > 0 ? item.notes.join(' ') : item.missed ? 'Không nghe thấy.' : 'Đọc chưa chuẩn.'}
            </ThemedText>
          ))}
          {pronunciationFeedback(result.pronunciation).length === 0 && <ThemedText>Phát âm rõ ràng, không có lỗi nào được phát hiện.</ThemedText>}
        </LearnerPanel>
      )}
      {transcript !== null && (
        <LearnerPanel>
          <ThemedText type="smallBold">Bản phiên âm</ThemedText>
          <ThemedText selectable>{transcript || 'Không nhận diện được lời nói.'}</ThemedText>
        </LearnerPanel>
      )}
    </>
  );
}
