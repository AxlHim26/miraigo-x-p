import { useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { VocabularyText, vocabularyIcons } from '@/features/vocabulary/components/vocabulary-ui';
import { vocabularyQuestions } from '@/features/vocabulary/data/vocabulary-study';
import { useVocabularyQuizHistory } from '@/features/vocabulary/hooks/use-vocabulary-quiz-history';
import type { VocabularyEntry } from '@/features/vocabulary/services/vocabulary-service';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

type Result = { word: VocabularyEntry; answer: string; correct: boolean };
const waves = [8, 13, 23, 17, 11];

export function VocabularyQuiz({ words, back }: { words: VocabularyEntry[]; back: Href }) {
  const [round, setRound] = useState(0);
  return <QuizRound key={round} words={words} back={back} round={round} restart={() => setRound((attempt) => attempt + 1)} />;
}

function QuizRound({ words, round, back, restart }: { words: VocabularyEntry[]; round: number; back: Href; restart: () => void }) {
  const [questions] = useState(() => {
    const offset = words.length ? (round * 10) % words.length : 0;
    return vocabularyQuestions([...words.slice(offset), ...words.slice(0, offset)], round);
  });
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [complete, setComplete] = useState(false);
  const submitted = useRef(false);
  const activity = useVocabularyQuizHistory();
  const speech = useStudySpeech(questions.map(({ word }) => word.term));
  const question = questions[index];
  const grade = results[index];

  useFocusEffect(useCallback(() => {
    if (complete) return;
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [complete]));

  function advance() {
    if (!question || !answer) return;
    if (!grade) {
      setResults((entries) => entries.length === index
        ? [...entries, { word: question.word, answer, correct: question.word.meaning === answer }]
        : entries);
    } else if (index + 1 < questions.length) {
      speech.stop();
      setAnswer('');
      setIndex(index + 1);
    } else if (!submitted.current) {
      submitted.current = true;
      speech.stop();
      activity.record(results.filter(({ correct }) => correct).length, results.length);
      setComplete(true);
    }
  }

  return (
    <StudyScreen title={complete ? 'Kết quả' : 'Bài tập'} largeTitle back={back}>
      {complete ? <QuizResult results={results} error={activity.error} restart={restart} /> : question ? (
        <QuizCard
          question={question} progress={index} total={questions.length} answer={answer} elapsed={elapsed} grade={grade}
          onSelect={setAnswer} onSubmit={advance} speech={speech}
        />
      ) : <StudyPanel><StudyText>Cần ít nhất hai từ có nghĩa khác nhau để tạo bài tập.</StudyText></StudyPanel>}
    </StudyScreen>
  );
}

function QuizCard({ question, progress, total, answer, elapsed, grade, onSelect, onSubmit, speech }: {
  question: ReturnType<typeof vocabularyQuestions>[number];
  progress: number;
  total: number;
  answer: string;
  elapsed: number;
  grade?: Result;
  onSelect: (answer: string) => void;
  onSubmit: () => void;
  speech: ReturnType<typeof useStudySpeech>;
}) {
  const colors = useStudyColors();
  const timer = [Math.floor(elapsed / 60), elapsed % 60].map((part) => String(part).padStart(2, '0')).join(':');

  return (
    <>
      <View style={styles.progress}>
        <Text style={[styles.counter, { color: colors.title }]}>{progress + 1} / {total}</Text>
        <StudyProgressBar fraction={(progress + Number(!!grade)) / total} style={styles.track} />
        <StudyIcon name={vocabularyIcons.clock} color={colors.icon} size={15} />
        <Text style={[styles.counter, { color: colors.secondary }]}>{timer}</Text>
      </View>
      {question.listen && (
        <StudyPanel style={styles.audio}>
          <Wave height={waves} />
          <StudyIconButton icon={speech.playing ? vocabularyIcons.pause : vocabularyIcons.speaker} label={speech.playing ? 'Dừng phát' : 'Nghe từ cần đoán'}
            onPress={speech.playing ? speech.stop : () => void speech.play(progress)} size={54} />
          <Wave height={[...waves].reverse()} />
        </StudyPanel>
      )}
      <StudyText heading>{question.listen ? 'Từ vừa nghe có nghĩa là gì?' : `“${question.word.term}” có nghĩa là gì?`}</StudyText>
      <View style={styles.choices}>
        {question.choices.map((choice) => {
          const selected = choice === answer;
          const right = !!grade && choice === question.word.meaning;
          const border = right ? colors.green : grade && selected ? '#B44545' : selected ? colors.icon : colors.border;
          return (
            <Pressable key={choice} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: !!grade }}
              disabled={!!grade} onPress={() => onSelect(choice)} style={({ pressed }) => [styles.choice, {
                backgroundColor: selected || right ? colors.iconFill : colors.surface, borderColor: border,
                opacity: pressed ? 0.7 : 1, boxShadow: `0px 2px 8px ${colors.shadow}`,
              }]}>
              <View style={[styles.radio, { borderColor: selected || right ? border : colors.secondary }]}>
                {selected && <View style={[styles.dot, { backgroundColor: border }]} />}
              </View>
              <Text style={[styles.choiceText, { color: colors.title }]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
      {grade && <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: grade.correct ? colors.green : colors.secondary }]}>
        {grade.correct ? 'Chính xác!' : `Đáp án đúng: ${question.word.meaning}`}
      </Text>}
      {speech.failed && <StudyText>Thiết bị chưa phát được giọng tiếng Nhật.</StudyText>}
      <StudyActionButton tone="ink" icon={vocabularyIcons.next} label={grade ? progress + 1 === total ? 'Xem kết quả' : 'Tiếp theo' : 'Kiểm tra'}
        disabled={!answer} onPress={onSubmit} />
    </>
  );
}

function Wave({ height }: { height: number[] }) {
  const colors = useStudyColors();
  return (
    <View accessible={false} style={styles.wave}>
      {height.map((value, index) => <View key={index} style={[styles.bar, { height: value, backgroundColor: colors.icon }]} />)}
    </View>
  );
}

function QuizResult({ results, error, restart }: { results: Result[]; error: boolean; restart: () => void }) {
  const colors = useStudyColors();
  const [wrongVisible, setWrongVisible] = useState(false);
  const wrong = results.filter(({ correct }) => !correct);
  const correct = results.length - wrong.length;
  return (
    <>
      <View style={styles.resultHero}>
        <StudyRing size={140} progress={correct / Math.max(results.length, 1)}>
          <Text style={[styles.score, { color: colors.title }]}>{correct} / {results.length}</Text>
          <Text style={[styles.correct, { color: colors.green }]}>Đúng</Text>
        </StudyRing>
      </View>
      <StudyPanel style={styles.results}>
        {[{ label: 'Đúng', count: correct, icon: vocabularyIcons.check, color: colors.green },
          { label: 'Sai', count: wrong.length, icon: vocabularyIcons.close, color: '#B44545' }].map((entry) => (
          <View key={entry.label} style={styles.resultLine}>
            <StudyIcon name={entry.icon} color={entry.color} size={17} />
            <Text style={[styles.lineLabel, { color: colors.title }]}>{entry.label}</Text>
            <Text style={{ color: colors.secondary }}>{entry.count} câu</Text>
          </View>
        ))}
      </StudyPanel>
      {error && <StudyText>Chưa lưu được kết quả bài tập trên thiết bị.</StudyText>}
      {wrong.length > 0 && <StudyActionButton tone="ink" label={wrongVisible ? 'Ẩn câu sai' : 'Xem lại câu sai'}
        onPress={() => setWrongVisible((value) => !value)} />}
      {wrongVisible && <WrongAnswers wrong={wrong} />}
      <StudyActionButton secondary label="Làm lại" onPress={restart} />
    </>
  );
}

function WrongAnswers({ wrong }: { wrong: Result[] }) {
  const speech = useStudySpeech(wrong.map(({ word }) => word.term));
  return (
    <View style={styles.choices}>
      {wrong.map(({ word, answer }, index) => (
        <StudyPanel key={word.id} style={styles.wrong}>
          <StudyIconButton size={38} icon={speech.playing && speech.index === index ? vocabularyIcons.pause : vocabularyIcons.speaker}
            label={speech.playing && speech.index === index ? 'Dừng phát' : `Nghe từ ${word.term}`}
            onPress={speech.playing && speech.index === index ? speech.stop : () => void speech.play(index)} />
          <View style={styles.wrongText}>
            <StudyText heading>{word.term}</StudyText>
            <VocabularyText>Đáp án đúng: {word.meaning}</VocabularyText>
            <VocabularyText>Bạn chọn: {answer}</VocabularyText>
          </View>
        </StudyPanel>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 28 },
  counter: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { flex: 1, marginHorizontal: 4 },
  audio: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 78 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.44 },
  bar: { width: 3, borderRadius: 2 },
  choices: { gap: 7 },
  choice: { flexDirection: 'row', alignItems: 'center', minHeight: 43, borderRadius: 14, borderWidth: 1, padding: 9, gap: 8 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.4, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  choiceText: { flex: 1, fontSize: 15, fontWeight: '600' },
  feedback: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  resultHero: { alignItems: 'center', paddingVertical: 23 },
  score: { fontSize: 27, fontWeight: '800' },
  correct: { fontSize: 14, fontWeight: '600' },
  results: { gap: 7 },
  resultLine: { flexDirection: 'row', alignItems: 'center', minHeight: 27, gap: 8 },
  lineLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  wrong: { flexDirection: 'row', alignItems: 'center' },
  wrongText: { flex: 1, minWidth: 0, gap: 3 },
});
