import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import {
  ListeningActionButton, ListeningFrame, ListeningIconButton, ListeningPanel, ListeningPills, ListeningProgressBar,
  ListeningRing, ListeningText, listeningCovers, listeningIcons, useListeningColors,
} from '@/features/listening/components/listening-ui';
import { allListeningLines, findListeningLesson, listeningLessons, type ListeningLesson, type ListeningLine } from '@/features/listening/data/listening-lessons';
import { matchesDictation } from '@/features/listening/data/listening-progress';
import { useListeningProgress } from '@/features/listening/hooks/use-listening-progress';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

const dictationModes = ['Chọn câu', 'Gõ lại'] as const;
const waveform = [4, 8, 5, 12, 17, 8, 5, 10, 18, 14, 7, 12, 16, 4, 9, 17, 10, 5, 12, 15, 8, 13, 5, 16, 9, 5];

type Attempt = { line: ListeningLine; answer: string; expected: string; correct: boolean };

export function ListeningExercise() {
  const { lessonId, mode, level, review } = useLocalSearchParams<{ lessonId?: string; mode?: string; level?: string; review?: string }>();
  const [round, setRound] = useState(0);
  const study = useListeningProgress();
  const lesson = findListeningLesson(lessonId);
  const meaning = mode === 'meaning';
  const lines = lesson?.lines ?? (lessonId ? [] : allListeningLines.filter((line) => !level || line.level === level));
  const back = lesson && review !== '1'
    ? { pathname: '/practice/listening/[lessonId]' as const, params: { lessonId: lesson.id } }
    : '/practice/listening';

  if (!lines.length || (!study.ready && !study.readError)) {
    return (
      <ListeningFrame title={meaning ? 'Câu hỏi' : 'Chính tả'} back={back}>
        <ListeningPanel><ListeningText>{lines.length ? 'Đang tải bài luyện…' : 'Không tìm thấy câu hỏi.'}</ListeningText></ListeningPanel>
      </ListeningFrame>
    );
  }

  return (
    <ExerciseSession key={`${lessonId ?? level ?? 'all'}:${mode}:${round}`}
      lines={lines} lesson={lesson} meaning={meaning} review={review === '1'} study={study}
      back={back} restart={() => setRound((value) => value + 1)} />
  );
}

function choicesFor(line: ListeningLine, lines: readonly ListeningLine[], meaning: boolean) {
  const correct = meaning ? line.meaning : line.japanese;
  const distractors = meaning ? [...line.distractors] : Array.from(new Set(
    [...lines, ...allListeningLines.filter((item) => item.level === line.level), ...allListeningLines]
      .map((item) => item.japanese).filter((text) => text !== line.japanese),
  )).slice(0, 2);
  distractors.splice(line.id % (distractors.length + 1), 0, correct);
  return distractors;
}

function ExerciseSession({ lines, lesson, meaning, review, study, back, restart }: {
  lines: readonly ListeningLine[];
  lesson?: ListeningLesson;
  meaning: boolean;
  review: boolean;
  study: ReturnType<typeof useListeningProgress>;
  back: Parameters<typeof ListeningFrame>[0]['back'];
  restart: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [dictation, setDictation] = useState<typeof dictationModes[number]>('Chọn câu');
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const submitted = useRef(false);
  const speech = useStudySpeech(lines.map((line) => line.speakText));
  const line = lines[index];
  const grade = attempts[index];
  const typing = !meaning && dictation === 'Gõ lại';
  const choices = choicesFor(line, lines, meaning);

  useFocusEffect(useCallback(() => {
    if (finished) return;
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [finished]));

  function continueExercise() {
    if (!grade) {
      if (!answer.trim()) return;
      const expected = meaning ? line.meaning : line.japanese;
      const correct = typing ? matchesDictation(line, answer) : answer === expected;
      setAttempts((previous) => previous.length === index ? [...previous, { line, answer, expected, correct }] : previous);
      return;
    }
    speech.stop();
    if (index + 1 < lines.length) {
      setAnswer('');
      setIndex(index + 1);
    } else if (!submitted.current) {
      submitted.current = true;
      for (const practiced of lesson ? [lesson] : listeningLessons) {
        const graded = attempts.filter(({ line: answered }) => practiced.lines.some(({ id }) => id === answered.id));
        if (!graded.length) continue;
        study.record({
          type: 'submit',
          lesson: practiced,
          answers: graded.length,
          correct: graded.filter((item) => item.correct).length,
          review,
        });
      }
      setFinished(true);
    }
  }

  if (finished) {
    return (
      <ListeningFrame title="Kết quả" back={back}>
        <ExerciseResult
          attempts={attempts}
          saveError={study.saveError || study.readError}
          restart={restart}
        />
      </ListeningFrame>
    );
  }

  return (
    <ListeningFrame title={meaning ? 'Câu hỏi' : 'Chính tả'} back={back}>
      <QuestionCard
        key={line.id}
        index={index}
        total={lines.length}
        elapsed={elapsed}
        meaning={meaning}
        typing={typing}
        dictation={dictation}
        setDictation={(next) => { setDictation(next); setAnswer(''); }}
        playing={speech.playing}
        fraction={speech.index === index ? speech.fraction : 0}
        speechFailed={speech.failed}
        play={speech.playing ? speech.stop : () => void speech.play(index)}
        choices={choices}
        answer={answer}
        setAnswer={setAnswer}
        grade={grade}
        submit={continueExercise}
      />
    </ListeningFrame>
  );
}

function QuestionCard({ index, total, elapsed, meaning, typing, dictation, setDictation, playing, fraction, speechFailed, play, choices, answer, setAnswer, grade, submit }: {
  index: number;
  total: number;
  elapsed: number;
  meaning: boolean;
  typing: boolean;
  dictation: typeof dictationModes[number];
  setDictation: (mode: typeof dictationModes[number]) => void;
  playing: boolean;
  fraction: number;
  speechFailed: boolean;
  play: () => void;
  choices: string[];
  answer: string;
  setAnswer: (answer: string) => void;
  grade?: Attempt;
  submit: () => void;
}) {
  const colors = useListeningColors();
  const clock = [Math.floor(elapsed / 60), elapsed % 60].map((value) => String(value).padStart(2, '0')).join(':');
  return (
    <>
      <View style={styles.exerciseProgress}>
        <ListeningProgressBar fraction={(index + (grade ? 1 : 0)) / total} style={styles.exerciseTrack} />
        <Text style={[styles.timerText, { color: colors.title }]}>{index + 1} / {total}</Text>
      </View>
      <View style={styles.timer}>
        <StudyIcon name={listeningIcons.clock} color={colors.icon} size={14} />
        <Text style={[styles.timerText, { color: colors.secondary }]}>{clock}</Text>
      </View>
      <View style={styles.exerciseImage}>
        <Image accessible={false} source={listeningCovers.headphones} contentFit="cover" style={StyleSheet.absoluteFill} />
      </View>
      <ListeningPanel style={styles.wavePlayer}>
        <ListeningIconButton icon={playing ? listeningIcons.pause : listeningIcons.play} primary label={playing ? 'Dừng phát' : 'Phát câu hỏi'} onPress={play} size={37} />
        <View accessible={false} style={styles.waveform}>
          {waveform.map((height, offset) => (
            <View key={offset} style={[styles.waveBar, { height, backgroundColor: offset / waveform.length <= fraction ? colors.icon : colors.track }]} />
          ))}
        </View>
      </ListeningPanel>
      {!meaning && !grade && <ListeningPills options={dictationModes} current={dictation} onSelect={setDictation} />}
      <ListeningText>{meaning ? 'Nghe và chọn nghĩa đúng.' : typing ? 'Gõ lại câu tiếng Nhật vừa nghe.' : 'Nghe và chọn câu đúng với nội dung vừa nghe.'}</ListeningText>
      {typing ? (
        <TextInput
          accessibilityLabel="Câu tiếng Nhật bạn nghe được"
          value={answer} editable={!grade} onChangeText={setAnswer} maxLength={200}
          autoCorrect={false} autoCapitalize="none" multiline placeholder="Nhập câu tiếng Nhật"
          placeholderTextColor={colors.secondary}
          style={[styles.input, { color: colors.title, backgroundColor: colors.surface, borderColor: grade ? grade.correct ? colors.green : '#B33D45' : colors.divider }]}
        />
      ) : (
        <View style={styles.choices}>
          {choices.map((choice) => {
            const selected = choice === answer;
            const correctChoice = grade?.expected === choice;
            const border = correctChoice ? colors.green : grade && selected ? '#B33D45' : selected ? colors.icon : colors.divider;
            return (
              <Pressable
                key={choice}
                accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: !!grade }} disabled={!!grade}
                onPress={() => setAnswer(choice)}
                style={({ pressed }) => [styles.choice, { backgroundColor: selected || correctChoice ? colors.iconFill : colors.surface, borderColor: border, opacity: pressed ? 0.75 : 1 }]}>
                <View style={[styles.radio, { borderColor: border }]}>
                  {selected && <View style={[styles.radioDot, { backgroundColor: border }]} />}
                </View>
                <Text style={[styles.choiceText, { color: colors.text }]}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {speechFailed && <ListeningText>Thiết bị chưa phát được giọng tiếng Nhật.</ListeningText>}
      {grade && (
        <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: grade.correct ? colors.green : colors.secondary }]}>
          {grade.correct ? 'Chính xác!' : `Đáp án đúng: ${grade.expected}`}
        </Text>
      )}
      <ListeningActionButton
        label={grade ? index + 1 === total ? 'Xem kết quả' : 'Tiếp theo' : 'Kiểm tra'}
        onPress={submit} disabled={!answer.trim()} icon={listeningIcons.next}
      />
    </>
  );
}

function ExerciseResult({ attempts, saveError, restart }: { attempts: Attempt[]; saveError: boolean; restart: () => void }) {
  const colors = useListeningColors();
  const [showWrong, setShowWrong] = useState(false);
  const wrong = attempts.filter((attempt) => !attempt.correct);
  const correct = attempts.length - wrong.length;
  return (
    <>
      <View style={styles.resultHero}>
        <Image accessible={false} source={listeningCovers.fuji} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: 0.75 }]} />
        <ListeningRing size={139} progress={correct / Math.max(attempts.length, 1)}>
          <Text style={[styles.score, { color: colors.title }]}>{correct}<Text style={styles.total}> / {attempts.length}</Text></Text>
          <Text style={[styles.timerText, { color: colors.secondary }]}>Điểm số</Text>
        </ListeningRing>
        <View style={styles.finish}>
          <StudyIcon name={listeningIcons.check} color={colors.green} size={20} />
          <ListeningText heading>Hoàn thành!</ListeningText>
        </View>
        <ListeningText>{wrong.length ? 'Nghe lại các câu chưa đúng để củng cố kỹ năng.' : 'Bạn đã trả lời đúng tất cả các câu.'}</ListeningText>
      </View>
      <View style={styles.resultCounts}>
        <ListeningPanel style={styles.resultCount}>
          <StudyIcon name={listeningIcons.check} color={colors.green} size={18} />
          <View><Text style={[styles.countNumber, { color: colors.title }]}>{correct}</Text><ListeningText>Câu đúng</ListeningText></View>
        </ListeningPanel>
        <ListeningPanel style={styles.resultCount}>
          <StudyIcon name={listeningIcons.close} color="#B33D45" size={17} />
          <View><Text style={[styles.countNumber, { color: colors.title }]}>{wrong.length}</Text><ListeningText>Câu sai</ListeningText></View>
        </ListeningPanel>
      </View>
      {saveError && <ListeningText>Chưa lưu được kết quả luyện nghe trên thiết bị.</ListeningText>}
      {!!wrong.length && <ListeningActionButton icon={listeningIcons.transcript}
        label={showWrong ? 'Ẩn câu sai' : 'Xem lại câu sai'} onPress={() => setShowWrong((value) => !value)} />}
      {showWrong && <WrongAnswers attempts={wrong} />}
      <ListeningActionButton secondary icon={listeningIcons.repeat} label="Làm lại" onPress={restart} />
    </>
  );
}

function WrongAnswers({ attempts }: { attempts: Attempt[] }) {
  const colors = useListeningColors();
  const speech = useStudySpeech(attempts.map(({ line }) => line.speakText));
  return (
    <View style={styles.choices}>
      {attempts.map(({ line, expected, answer }, index) => {
        const active = speech.playing && speech.index === index;
        return (
          <ListeningPanel key={line.id} style={styles.wrong}>
            <ListeningIconButton icon={active ? listeningIcons.pause : listeningIcons.play} label={active ? 'Dừng phát' : `Nghe lại câu sai ${index + 1}`}
              onPress={active ? speech.stop : () => void speech.play(index)} size={36} />
            <View style={styles.wrongCopy}>
              <Text selectable style={[styles.choiceText, { color: colors.title }]}>{line.japanese}</Text>
              <ListeningText>Đáp án: {expected}</ListeningText>
              <ListeningText>Bạn chọn: {answer}</ListeningText>
            </View>
          </ListeningPanel>
        );
      })}
      {speech.failed && <ListeningText>Thiết bị chưa phát được giọng tiếng Nhật.</ListeningText>}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseTrack: { flex: 1 },
  timer: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  exerciseImage: { aspectRatio: 2.55, borderRadius: 18, overflow: 'hidden', backgroundColor: '#B7C8D8' },
  wavePlayer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12, borderRadius: 24 },
  waveform: { flex: 1, flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  waveBar: { width: 2, borderRadius: 1 },
  input: { minHeight: 66, borderWidth: 1, borderRadius: 13, padding: 10, fontSize: 16, textAlignVertical: 'top' },
  choices: { gap: 6 },
  choice: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 11 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  choiceText: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  feedback: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  resultHero: { overflow: 'hidden', borderRadius: 21, alignItems: 'center', gap: 10, padding: 16 },
  score: { fontSize: 29, fontWeight: '800' },
  total: { fontSize: 20, fontWeight: '600' },
  finish: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultCounts: { flexDirection: 'row', gap: 7 },
  resultCount: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  countNumber: { fontSize: 23, fontWeight: '800' },
  wrong: { flexDirection: 'row', alignItems: 'center' },
  wrongCopy: { flex: 1, minWidth: 0, gap: 3 },
});
