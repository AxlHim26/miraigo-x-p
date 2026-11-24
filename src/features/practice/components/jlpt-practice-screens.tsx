import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { getHttpUrl, LearnerBack, LearnerLoadState } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel } from '@/components/ui/learner-glass';
import { StudyAudio } from '@/components/ui/study-audio';
import { evaluatePlacement, getJlptQuestions, getPublishedExams } from '@/features/practice/services/jlpt-service';
import type { JlptPracticeQuestion } from '@/features/practice/types/jlpt-schema';

export const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const topics = [
  { id: 'LANGUAGE_KNOWLEDGE', label: 'Từ vựng và Kanji' },
  { id: 'GRAMMAR_KNOWLEDGE', label: 'Ngữ pháp' },
  { id: 'READING', label: 'Đọc hiểu' },
  { id: 'LISTENING', label: 'Nghe hiểu' },
] as const;

function parseLevel(value: string) {
  return jlptLevels.find((level) => level.toLowerCase() === value.toLowerCase());
}

function levelHref(level: string) {
  return { pathname: '/practice/jlpt/[level]' as const, params: { level: level.toLowerCase() } };
}

export function JlptLevelScreen() {
  const params = useLocalSearchParams<{ level: string }>();
  const level = parseLevel(params.level);
  return (
    <LearnerCanvas>
      <LearnerBack label="JLPT Dojo" href="/practice" />
      {level ? (
        <>
          <LearnerHeading title={`JLPT ${level}`} description="Luyện từng kỹ năng hoặc làm đề thi thử theo thời gian." />
          {topics.map((topic) => (
            <LearnerControl key={topic.id} label={topic.label} glyph="›" onPress={() => router.push({
              pathname: '/practice/jlpt/[level]/quiz',
              params: { level: params.level, type: topic.id },
            })} />
          ))}
          <LearnerControl label="Đề thi thử" tone="accent" glyph="›" onPress={() => router.push({
            pathname: '/practice/jlpt/[level]/mock', params: { level: params.level },
          })} />
        </>
      ) : <ThemedText>Cấp độ JLPT không hợp lệ.</ThemedText>}
    </LearnerCanvas>
  );
}

export function JlptMockScreen() {
  const params = useLocalSearchParams<{ level: string }>();
  const level = parseLevel(params.level);
  const exams = useQuery({ queryKey: ['jlpt', 'published-exams'], queryFn: getPublishedExams, enabled: !!level });
  const available = exams.data?.filter((exam) => exam.level.toUpperCase() === level);
  return (
    <LearnerCanvas>
      <LearnerBack label={level ?? 'JLPT Dojo'} href={level ? levelHref(level) : '/practice'} />
      <LearnerHeading title={level ? `Thi thử JLPT ${level}` : 'Thi thử JLPT'} />
      <LearnerLoadState pending={!!level && exams.isPending} error={exams.error} missing={!level} retry={() => void exams.refetch()} />
      {available?.length === 0 && <ThemedText>Chưa có đề thi được công bố cho cấp độ này.</ThemedText>}
      {available?.map((exam) => (
        <LearnerPanel key={exam.id}>
          <ThemedText type="smallBold">{exam.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{exam.totalDurationMinutes} phút</ThemedText>
          <LearnerControl label="Mở đề thi" glyph="›" onPress={() => router.push({
            pathname: '/practice/jlpt/exam/[examId]', params: { examId: exam.id },
          })} />
        </LearnerPanel>
      ))}
    </LearnerCanvas>
  );
}

export function JlptQuizScreen() {
  const params = useLocalSearchParams<{ level: string; type?: string }>();
  const placement = params.level.toLowerCase() === 'placement';
  const level = placement ? 'PLACEMENT' : parseLevel(params.level);
  const topic = topics.find((item) => item.id === params.type);
  const type = placement ? 'ASSESSMENT' : topic?.id;
  const valid = !!level && !!type;
  const query = useQuery({
    queryKey: ['jlpt', 'practice', level, type],
    queryFn: ({ signal }) => getJlptQuestions(level!, type!, signal),
    enabled: valid,
    staleTime: Infinity,
    refetchOnMount: false,
  });
  return (
    <LearnerCanvas>
      <LearnerBack label={placement ? 'JLPT Dojo' : (level ?? 'JLPT Dojo')} href={level && !placement ? levelHref(level) : '/practice'} />
      <LearnerHeading title={placement ? 'Kiểm tra xếp lớp' : `${level ?? 'JLPT'} · ${topic?.label ?? 'Luyện tập'}`} />
      <LearnerLoadState pending={valid && query.isFetching} error={query.error} missing={!valid} retry={() => void query.refetch()} />
      {query.data?.length === 0 && <ThemedText>Chưa có câu hỏi cho nội dung này.</ThemedText>}
      {!query.isFetching && !!query.data?.length && (
        <Quiz key={query.dataUpdatedAt} questions={query.data} placement={placement} onRestart={() => void query.refetch()} />
      )}
    </LearnerCanvas>
  );
}

function Quiz({ questions, placement, onRestart }: {
  questions: JlptPracticeQuestion[];
  placement: boolean;
  onRestart: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const assessment = useMutation({ mutationFn: evaluatePlacement, onSuccess: () => setFinished(true) });
  const question = questions[index];
  const selected = answers[question.id];
  const correctKey = question.correctOptionKey?.trim().toUpperCase();
  const audio = getHttpUrl(question.audioUrl);
  const last = index === questions.length - 1;

  if (finished) {
    const scored = questions.filter((item) => item.correctOptionKey);
    const count = scored.filter((item) => answers[item.id]?.toUpperCase() === item.correctOptionKey?.trim().toUpperCase()).length;
    return (
      <LearnerPanel>
        <ThemedText type="smallBold">{placement ? `Cấp độ đề xuất: ${assessment.data}` : `Kết quả: ${count} / ${scored.length} câu đúng`}</ThemedText>
        <LearnerControl label="Luyện với bộ câu hỏi mới" tone="accent" onPress={onRestart} />
      </LearnerPanel>
    );
  }

  function next() {
    if (!last) {
      setIndex(index + 1);
      setChecked(false);
      return;
    }
    if (placement) {
      const submission = questions.map((item) => ({ questionId: item.id, selectedOptionKey: answers[item.id] }));
      if (submission.every((answer) => typeof answer.selectedOptionKey === 'string')) assessment.mutate(submission);
    } else {
      setFinished(true);
    }
  }

  return (
    <LearnerPanel>
      <ThemedText type="smallBold">Câu {index + 1} / {questions.length}</ThemedText>
      {question.passageText && <ThemedText selectable>{question.passageText}</ThemedText>}
      <ThemedText selectable>{question.prompt}</ThemedText>
      {audio && <StudyAudio url={audio} />}
      {question.options.map((option) => (
        <LearnerControl key={option.key} label={`${option.key}. ${option.text}`} selected={selected === option.key}
          disabled={checked || assessment.isPending} onPress={() => setAnswers((old) => ({ ...old, [question.id]: option.key }))} />
      ))}
      {checked && (
        <>
          <ThemedText accessibilityLiveRegion="polite">{correctKey
            ? (selected?.toUpperCase() === correctKey ? 'Chính xác!' : `Đáp án đúng: ${correctKey}`)
            : 'Câu hỏi này chưa có đáp án chấm điểm.'}</ThemedText>
          {question.explanation && <ThemedText selectable>{question.explanation}</ThemedText>}
        </>
      )}
      {assessment.isError && <ThemedText accessibilityLiveRegion="polite">Chưa chấm được bài xếp lớp. Hãy thử lại.</ThemedText>}
      {!placement && !checked && question.options.length > 0
        ? <LearnerControl label="Kiểm tra đáp án" tone="accent" disabled={!selected} onPress={() => setChecked(true)} />
        : <LearnerControl label={last ? 'Xem kết quả' : 'Câu tiếp theo'} tone="accent"
          disabled={assessment.isPending || (question.options.length > 0 && !selected)} onPress={next} />}
    </LearnerPanel>
  );
}
