import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getHttpUrl, LearnerBack, LearnerLoadState } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, LearnerSectionHeading } from '@/components/ui/learner-glass';
import { StudyAudio } from '@/components/ui/study-audio';
import { getJlptAttempt, getJlptExam, getJlptHistory, getJlptResult, saveJlptAnswer, startJlptAttempt, submitJlptAttempt, updateJlptSection } from '@/features/practice/services/jlpt-service';
import type { JlptExamDetail, JlptStartAttemptResponse } from '@/features/practice/types/jlpt-schema';
import { parseRouteId } from '@/shared/utils/route-id';

const attemptKey = (id: number) => ['jlpt', 'attempt', id] as const;
const historyKey = ['jlpt', 'history'] as const;
const attemptHref = (attemptId: number) => ({ pathname: '/practice/jlpt/attempt/[attemptId]' as const, params: { attemptId } });
const resultHref = (attemptId: number) => ({ pathname: '/practice/jlpt/attempt/[attemptId]/result' as const, params: { attemptId } });
const useExam = (id: number | null) => useQuery({
  queryKey: ['jlpt', 'exam', id],
  queryFn: ({ signal }) => getJlptExam(id!, signal),
  enabled: id !== null,
  staleTime: 60_000,
});

export function JlptExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const id = parseRouteId(examId);
  const exam = useExam(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const start = useMutation({
    mutationFn: (examId: number) => startJlptAttempt(examId),
    onSuccess: (session) => {
      queryClient.setQueryData(attemptKey(session.attemptId), session);
      void queryClient.invalidateQueries({ queryKey: historyKey });
      router.push(attemptHref(session.attemptId));
    },
  });
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="JLPT Dojo" />
      <LearnerLoadState pending={id !== null && exam.isPending} error={exam.error} missing={!id} retry={() => void exam.refetch()} />
      {exam.data && (
        <>
          <LearnerHeading eyebrow={exam.data.level} title={exam.data.title} description={`${exam.data.totalDurationMinutes} phút · ${exam.data.sections.length} phần thi`} />
          {exam.data.sections.map((section) => (
            <LearnerPanel key={section.id}>
              <ThemedText type="smallBold">{section.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{section.durationMinutes} phút · {section.questions.length} câu</ThemedText>
            </LearnerPanel>
          ))}
          {start.isError && <ThemedText accessibilityLiveRegion="polite">Chưa mở được lượt thi. Hãy thử lại.</ThemedText>}
          {exam.data.sections.length > 0 && (
            <LearnerControl label="Bắt đầu hoặc tiếp tục bài thi" tone="accent" disabled={start.isPending} onPress={() => start.mutate(exam.data.id)} style={styles.action} />
          )}
        </>
      )}
    </LearnerCanvas>
  );
}

export function JlptAttemptScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const id = parseRouteId(attemptId);
  const session = useQuery({
    queryKey: ['jlpt', 'attempt', id],
    queryFn: ({ signal }) => getJlptAttempt(id!, signal),
    enabled: id !== null,
    refetchOnWindowFocus: false,
  });
  const exam = useExam(session.data?.examId ?? null);
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice/jlpt/history" label="Lịch sử làm bài" />
      <LearnerLoadState pending={id !== null && (session.isPending || Boolean(session.data && exam.isPending))} error={session.error ?? exam.error} missing={!id} retry={() => void (session.isError ? session.refetch() : exam.refetch())} />
      {session.data && exam.data && <AttemptContent key={session.data.attemptId} session={session.data} sessionUpdatedAt={session.dataUpdatedAt} exam={exam.data} />}
    </LearnerCanvas>
  );
}

type ExamAction =
  | { type: 'start' | 'close'; sectionId: number }
  | { type: 'answer'; questionId: number; selectedOptionKey: string }
  | { type: 'submit' };

function AttemptContent({ session, sessionUpdatedAt, exam }: {
  session: JlptStartAttemptResponse;
  sessionUpdatedAt: number;
  exam: JlptExamDetail;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [confirm, setConfirm] = useState<'section' | 'exam' | null>(null);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [now, setNow] = useState(sessionUpdatedAt);
  const id = session.attemptId;
  const section = exam.sections.find((item) => item.id === sectionId);
  const timer = session.sectionAttempts?.find((item) => item.sectionId === sectionId);
  const elapsed = Math.max(0, Math.floor((now - sessionUpdatedAt) / 1000));
  const left = Math.max(0, session.remainingSeconds - elapsed);
  const sectionLeft = Math.max(0, Math.min(left, (timer?.remainingSeconds ?? 0) - elapsed));
  const open = session.status === 'IN_PROGRESS';

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [open]);

  const action = useMutation({
    mutationFn: async (cmd: ExamAction) => {
      if (cmd.type === 'submit') {
        await submitJlptAttempt(id);
        return;
      }
      if (cmd.type === 'answer') {
        await saveJlptAnswer(id, { questionId: cmd.questionId, selectedOptionKey: cmd.selectedOptionKey });
      } else {
        await updateJlptSection(id, cmd.sectionId, cmd.type === 'start' ? 'start' : 'submit');
      }
      // Read the authoritative remaining time and saved answers after each write.
      return getJlptAttempt(id);
    },
    onSuccess: (fresh, cmd) => {
      if (fresh) queryClient.setQueryData(attemptKey(id), fresh);
      if (cmd.type === 'start') {
        setSectionId(cmd.sectionId);
        setQuestionIndex(0);
      }
      if (cmd.type === 'close') setSectionId(null);
      if (cmd.type === 'submit') {
        void queryClient.invalidateQueries({ queryKey: attemptKey(id) });
        void queryClient.invalidateQueries({ queryKey: historyKey });
        router.replace(resultHref(id));
      }
      setConfirm(null);
    },
    onError: () => { void queryClient.invalidateQueries({ queryKey: attemptKey(id) }); },
  });

  const question = section?.questions[questionIndex];
  const audio = getHttpUrl(question?.audioUrl);
  const currentAnswer = session.answers.find((answer) => answer.questionId === question?.id)?.selectedOptionKey;
  const sectionSubmitted = timer?.sectionStatus === 'SUBMITTED';
  const allSubmitted = exam.sections.every((item) => session.sectionAttempts?.some((value) => value.sectionId === item.id && value.sectionStatus === 'SUBMITTED'));

  return (
    <>
      <LearnerHeading eyebrow={exam.level} title={exam.title} />
      {action.isError && <ThemedText accessibilityLiveRegion="polite">Không cập nhật được bài thi. Kiểm tra kết nối và thử lại.</ThemedText>}
      {!open ? (
        <LearnerControl label="Xem kết quả" tone="accent" onPress={() => router.replace(resultHref(id))} style={styles.action} />
      ) : (
        <>
          <ThemedText type="smallBold">Còn lại {formatTime(left)}</ThemedText>
          {left === 0 ? (
            <LearnerControl label="Xem kết quả khi hết giờ" onPress={() => router.replace(resultHref(id))} style={styles.action} />
          ) : section && !sectionSubmitted ? (
            <LearnerPanel>
              <ThemedText type="smallBold">{section.title} · {formatTime(sectionLeft)}</ThemedText>
              {question ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary">Câu {questionIndex + 1} / {section.questions.length}</ThemedText>
                  {question.passageText && <ThemedText selectable>{question.passageText}</ThemedText>}
                  <ThemedText selectable>{question.prompt}</ThemedText>
                  {audio && <StudyAudio url={audio} />}
                  {question.options.map((option) => (
                    <LearnerControl key={option.key} selected={currentAnswer === option.key} label={`${option.key}. ${option.text}`} disabled={action.isPending || sectionLeft === 0 || confirm !== null} onPress={() => action.mutate({ type: 'answer', questionId: question.id, selectedOptionKey: option.key })} />
                  ))}
                  <View style={styles.controls}>
                    <LearnerControl label="Câu trước" disabled={questionIndex === 0 || action.isPending} onPress={() => setQuestionIndex((i) => i - 1)} />
                    <LearnerControl label="Câu sau" disabled={questionIndex >= section.questions.length - 1 || action.isPending} onPress={() => setQuestionIndex((i) => i + 1)} />
                    <LearnerControl label={flagged[question.id] ? 'Bỏ đánh dấu' : 'Đánh dấu câu'} selected={Boolean(flagged[question.id])} onPress={() => setFlagged((old) => ({ ...old, [question.id]: !old[question.id] }))} />
                  </View>
                </>
              ) : <ThemedText>Phần này chưa có câu hỏi.</ThemedText>}
              <LearnerControl label="Danh sách phần thi" disabled={action.isPending} onPress={() => { setSectionId(null); setConfirm(null); }} style={styles.action} />
              {confirm === 'section'
                ? <Confirm label="Xác nhận nộp phần này" pending={action.isPending} onCancel={() => setConfirm(null)} onSubmit={() => action.mutate({ type: 'close', sectionId: section.id })} />
                : <LearnerControl label="Nộp phần thi" tone="accent" disabled={action.isPending} onPress={() => setConfirm('section')} style={styles.action} />}
            </LearnerPanel>
          ) : (
            <>
              <LearnerSectionHeading title="Các phần thi" />
              {exam.sections.map((item) => {
                const status = session.sectionAttempts?.find((attempt) => attempt.sectionId === item.id)?.sectionStatus;
                return (
                  <LearnerPanel key={item.id}>
                    <ThemedText type="smallBold">{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{item.questions.filter((q) => session.answers.some((a) => a.questionId === q.id && a.selectedOptionKey)).length} / {item.questions.length} câu đã chọn</ThemedText>
                    {status === 'SUBMITTED'
                      ? <ThemedText type="small">Đã nộp</ThemedText>
                      : <LearnerControl label={status ? 'Tiếp tục phần thi' : 'Bắt đầu phần thi'} disabled={action.isPending || confirm !== null} onPress={() => action.mutate({ type: 'start', sectionId: item.id })} style={styles.action} />}
                  </LearnerPanel>
                );
              })}
              {confirm === 'exam'
                ? <Confirm label="Xác nhận nộp toàn bài" pending={action.isPending} onCancel={() => setConfirm(null)} onSubmit={() => action.mutate({ type: 'submit' })} />
                : <LearnerControl label="Nộp toàn bài" disabled={!allSubmitted || action.isPending} tone="accent" onPress={() => setConfirm('exam')} style={styles.action} />}
            </>
          )}
        </>
      )}
    </>
  );
}

function Confirm({ label, pending, onSubmit, onCancel }: { label: string; pending: boolean; onSubmit: () => void; onCancel: () => void }) {
  return (
    <View style={styles.controls}>
      <LearnerControl label="Hủy" disabled={pending} onPress={onCancel} />
      <LearnerControl label={label} tone="danger" disabled={pending} onPress={onSubmit} />
    </View>
  );
}

export function JlptHistoryScreen() {
  const router = useRouter();
  const query = useQuery({ queryKey: historyKey, queryFn: ({ signal }) => getJlptHistory(signal) });
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="JLPT Dojo" />
      <LearnerHeading title="Lịch sử làm bài" />
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.data?.length === 0 && <LearnerPanel><ThemedText>Chưa có lượt thi.</ThemedText></LearnerPanel>}
      {query.data?.map((item) => (
        <LearnerPanel key={item.attemptId}>
          <ThemedText type="smallBold">{item.examTitle}</ThemedText>
          {item.totalScaledScore != null && <ThemedText>{item.totalScaledScore} điểm</ThemedText>}
          <LearnerControl
            label={item.status === 'SUBMITTED' ? 'Xem kết quả' : 'Tiếp tục làm bài'}
            onPress={() => router.push(item.status === 'SUBMITTED' ? resultHref(item.attemptId) : attemptHref(item.attemptId))}
            style={styles.action}
          />
        </LearnerPanel>
      ))}
    </LearnerCanvas>
  );
}

export function JlptResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const id = parseRouteId(attemptId);
  const [openSection, setOpenSection] = useState<number | null>(null);
  const result = useQuery({
    queryKey: ['jlpt', 'result', id],
    queryFn: ({ signal }) => getJlptResult(id!, signal),
    enabled: id !== null,
  });
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice/jlpt/history" label="Lịch sử làm bài" />
      <LearnerHeading title="Kết quả JLPT" description={result.data?.examTitle} />
      <LearnerLoadState pending={id !== null && result.isPending} error={result.error} missing={!id} retry={() => void result.refetch()} />
      {result.data && (
        <>
          <LearnerPanel><ThemedText type="smallBold">{result.data.totalScaledScore} điểm · {result.data.passed ? 'Đạt' : 'Chưa đạt'}</ThemedText></LearnerPanel>
          {result.data.sections.map((section) => (
            <LearnerPanel key={section.sectionId}>
              <ThemedText type="smallBold">{section.title} · {section.scaledScore}/{section.scaledMaxScore}</ThemedText>
              <LearnerControl label={openSection === section.sectionId ? 'Ẩn đáp án' : 'Xem đáp án'} accessibilityState={{ expanded: openSection === section.sectionId }} onPress={() => setOpenSection(openSection === section.sectionId ? null : section.sectionId)} style={styles.action} />
              {openSection === section.sectionId && section.questions.map((question) => (
                <View key={question.questionId} style={styles.answer}>
                  <ThemedText type="smallBold">{question.questionNumber ? `${question.questionNumber}. ` : ''}{question.prompt}</ThemedText>
                  <ThemedText type="small">{question.correct ? 'Đúng' : 'Sai / bỏ qua'} · Đã chọn: {question.selectedOptionKey ?? '—'}</ThemedText>
                  <ThemedText type="small">Đáp án: {question.correctOptionKey}. {question.options.find((option) => option.key === question.correctOptionKey)?.text}</ThemedText>
                  {question.explanation && <ThemedText type="small" themeColor="textSecondary">{question.explanation}</ThemedText>}
                </View>
              ))}
            </LearnerPanel>
          ))}
        </>
      )}
    </LearnerCanvas>
  );
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  answer: { gap: 5, marginTop: 10 },
  action: { alignSelf: 'flex-start', maxWidth: '100%' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
