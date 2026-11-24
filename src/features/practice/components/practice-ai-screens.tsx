import { useMutation } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { JapaneseSpeech } from '@/components/ui/japanese-speech';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, useLearnerPalette } from '@/components/ui/learner-glass';
import {
  annotateReadingLines, explainReadingWord, generateReadingExercise, streamPracticeChat, studyLevels,
  type ChatTurn, type ReadingExercise, type StudyLevel,
} from '@/features/practice/services/study-tools-service';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/utils/api-error';

function LevelOptions({ level, change, disabled }: { level: StudyLevel; change: (level: StudyLevel) => void; disabled?: boolean }) {
  return (
    <View style={styles.row}>
      {studyLevels.map((item) => <LearnerControl key={item} label={item} selected={item === level}
        disabled={disabled} onPress={() => change(item)} />)}
    </View>
  );
}

function StudyInput(props: TextInputProps) {
  const palette = useLearnerPalette();
  const theme = useTheme();
  return <TextInput placeholderTextColor={theme.textSecondary} {...props}
    style={[styles.input, { color: palette.text, borderColor: palette.border }]} />;
}

function studyError(error: unknown) {
  if (error instanceof ApiError && [401, 403].includes(error.status)) return 'Hãy đăng nhập lại để sử dụng công cụ.';
  return 'Dịch vụ AI chưa trả về kết quả. Vui lòng thử lại.';
}

export function PracticeChatScreen() {
  const [level, setLevel] = useState<StudyLevel>('N4');
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [outgoing, setOutgoing] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useFocusEffect(useCallback(() => () => request.current?.abort(), []));

  async function send() {
    const text = draft.trim();
    if (!text || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 120_000);
    setError('');
    setReply('');
    setOutgoing(text);
    setDraft('');
    let result = '';
    try {
      const context = history.slice(-12).map((turn) => ({ ...turn, content: turn.content.slice(0, 3000) }));
      await streamPracticeChat(text, level, context, controller.signal, (chunk) => {
        result += chunk;
        setReply(result);
      });
      setHistory((turns) => [...turns, { role: 'user', content: text }, { role: 'assistant', content: result }]);
    } catch (failure) {
      setDraft(text);
      if (timedOut) setError('AI phản hồi quá lâu. Bạn có thể gửi lại tin nhắn.');
      else if (!controller.signal.aborted) setError(studyError(failure));
    } finally {
      clearTimeout(timeout);
      request.current = null;
      setOutgoing('');
      setReply('');
    }
  }

  return (
    <LearnerCanvas>
      <LearnerBack label="Luyện tập" href="/practice" />
      <LearnerHeading title="AI Chat" description="Luyện hội thoại tiếng Nhật theo cấp độ JLPT." />
      <LevelOptions level={level} change={setLevel} disabled={!!outgoing} />
      {history.length > 0 && <LearnerControl label="Cuộc trò chuyện mới" disabled={!!outgoing} onPress={() => {
        setHistory([]); setDraft(''); setError('');
      }} />}
      {history.map((turn, index) => <ChatMessage key={index} turn={turn} />)}
      {!!outgoing && <ChatMessage turn={{ role: 'user', content: outgoing }} />}
      {!!outgoing && <LearnerPanel><ThemedText selectable>{reply || 'Đang chờ phản hồi…'}</ThemedText></LearnerPanel>}
      {!!error && <ThemedText accessibilityLiveRegion="polite">{error}</ThemedText>}
      <LearnerPanel>
        <StudyInput accessibilityLabel="Tin nhắn AI Chat" placeholder="Nhập tin nhắn" value={draft}
          multiline maxLength={1500} onChangeText={setDraft} editable={!outgoing} />
        <View style={styles.row}>
          {outgoing
            ? <LearnerControl label="Dừng trả lời" onPress={() => request.current?.abort()} />
            : <LearnerControl label="Gửi" tone="accent" disabled={!draft.trim()} onPress={() => void send()} />}
        </View>
      </LearnerPanel>
    </LearnerCanvas>
  );
}

function ChatMessage({ turn }: { turn: ChatTurn }) {
  return (
    <LearnerPanel>
      <ThemedText type="smallBold">{turn.role === 'user' ? 'Bạn' : 'MiraiGo'}</ThemedText>
      <ThemedText selectable>{turn.content}</ThemedText>
      {turn.role === 'assistant' && <JapaneseSpeech text={turn.content} />}
    </LearnerPanel>
  );
}

export function PracticeReadingScreen() {
  const [level, setLevel] = useState<StudyLevel>('N4');
  const [exercise, setExercise] = useState<ReadingExercise | null>(null);
  const request = useRef<AbortController | null>(null);
  const generate = useMutation({
    mutationFn: (data: { level: StudyLevel; signal: AbortSignal }) => generateReadingExercise(data.level, data.signal),
    onSuccess: (newExercise) => setExercise(newExercise),
    onSettled: () => { request.current = null; },
  });
  useFocusEffect(useCallback(() => () => request.current?.abort(), []));

  return (
    <LearnerCanvas>
      <LearnerBack label="Luyện tập" href="/practice" />
      <LearnerHeading title="Luyện đọc" />
      <LevelOptions level={level} change={setLevel} disabled={generate.isPending} />
      <LearnerControl label={generate.isPending ? 'Đang tạo bài đọc…' : 'Tạo bài đọc mới'} tone="accent"
        disabled={generate.isPending} onPress={() => {
          if (request.current) return;
          request.current = new AbortController();
          generate.mutate({ level, signal: request.current.signal });
        }} />
      {generate.isError && <ThemedText accessibilityLiveRegion="polite">{studyError(generate.error)}</ThemedText>}
      {exercise && <ReadingSession key={exercise.id} exercise={exercise} />}
    </LearnerCanvas>
  );
}

function ReadingSession({ exercise }: { exercise: ReadingExercise }) {
  const [line, setLine] = useState(0);
  const [word, setWord] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const annotations = useMutation({ mutationFn: annotateReadingLines });
  const explanation = useMutation({ mutationFn: () => explainReadingWord(word.trim(), exercise.passageLines[line].slice(0, 400)) });
  const score = exercise.questions.filter((question) => answers[question.id] === question.correctOptionId).length;
  return (
    <>
      <LearnerPanel>
        <LearnerHeading eyebrow={exercise.level} title={exercise.title} />
        {exercise.passageLines.map((value, index) => (
          <View key={index} style={styles.line}>
            <ThemedText selectable>{value}</ThemedText>
            {annotations.data?.[index]?.line === value && (
              <ThemedText themeColor="textSecondary">
                {annotations.data[index].romaji}{'\n'}{annotations.data[index].translation}
              </ThemedText>
            )}
          </View>
        ))}
        <JapaneseSpeech text={exercise.passageLines.join('\n')} />
        {!annotations.data && <LearnerControl label="Xem phiên âm và bản dịch" disabled={annotations.isPending}
          onPress={() => annotations.mutate(exercise.passageLines.slice(0, 30))} />}
        {annotations.isError && <ThemedText accessibilityLiveRegion="polite">{studyError(annotations.error)}</ThemedText>}
      </LearnerPanel>
      <LearnerPanel>
        <ThemedText type="smallBold">Tra từ trong bài</ThemedText>
        <View style={styles.row}>
          <LearnerControl label="Câu trước" disabled={line === 0 || explanation.isPending}
            onPress={() => { explanation.reset(); setLine(line - 1); }} />
          <LearnerControl label="Câu sau" disabled={line === exercise.passageLines.length - 1 || explanation.isPending}
            onPress={() => { explanation.reset(); setLine(line + 1); }} />
        </View>
        <ThemedText selectable>{exercise.passageLines[line]}</ThemedText>
        <StudyInput accessibilityLabel="Từ cần tra" placeholder="Nhập từ hoặc cụm từ" maxLength={30} value={word}
          onChangeText={(value) => { explanation.reset(); setWord(value); }} editable={!explanation.isPending} />
        <LearnerControl label="Giải nghĩa" disabled={!word.trim() || explanation.isPending} onPress={() => explanation.mutate()} />
        {explanation.isError && <ThemedText accessibilityLiveRegion="polite">{studyError(explanation.error)}</ThemedText>}
        {explanation.data && (
          <>
            <ThemedText type="smallBold">{explanation.data.word} · {explanation.data.reading}</ThemedText>
            <ThemedText>{explanation.data.meaningVi}</ThemedText>
            <ThemedText selectable>{explanation.data.exampleJa}{'\n'}{explanation.data.exampleVi}</ThemedText>
          </>
        )}
      </LearnerPanel>
      {exercise.questions.map((question, index) => (
        <LearnerPanel key={question.id}>
          <ThemedText type="smallBold">{index + 1}. {question.question}</ThemedText>
          {question.options.map((option) => <LearnerControl key={option.id} label={`${option.id}. ${option.text}`}
            selected={answers[question.id] === option.id} disabled={graded}
            onPress={() => setAnswers((previous) => ({ ...previous, [question.id]: option.id }))} />)}
          {graded && (
            <>
              <ThemedText>Đáp án {question.correctOptionId}</ThemedText>
              <ThemedText selectable>{question.explanationVi}{'\n'}{question.explanationJa}</ThemedText>
            </>
          )}
        </LearnerPanel>
      ))}
      <LearnerControl label={graded ? 'Làm lại' : 'Chấm bài'} tone="accent"
        disabled={!graded && Object.keys(answers).length !== exercise.questions.length}
        onPress={() => { if (graded) setAnswers({}); setGraded(!graded); }} />
      {graded && <ThemedText accessibilityLiveRegion="polite">Đúng {score}/{exercise.questions.length} câu.</ThemedText>}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 46, padding: 11, fontSize: 16 },
  line: { gap: 4 },
});
