import { useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { GrammarBadge, GrammarRow, grammarIcons } from '@/features/grammar/components/grammar-study-ui';
import { gradeGrammar, grammarAnswerText, grammarKindInfo, grammarLevel, type GrammarAnswer, type GrammarKind, type GrammarQuestion } from '@/features/grammar/data/grammar-exercises';
import { useGrammarStudy } from '@/features/grammar/hooks/use-grammar-study';
import type { GrammarLevel, GrammarPoint } from '@/features/grammar/types/catalog';

const previousIcon = studySymbol('chevron.left', 'chevron_left');
const letters = ['A', 'B', 'C', 'D'];

type QuizProps = {
  point?: GrammarPoint; level?: GrammarLevel['level']; kind: GrammarKind; questions: GrammarQuestion[]; back?: Href; title?: string; pointIds?: readonly string[]; passages?: readonly (string | null | undefined)[];
};
type Grade = { question: GrammarQuestion; answer: GrammarAnswer; right: boolean };

export function GrammarQuiz(props: QuizProps) {
  const [round, setRound] = useState(0);
  return <QuizRun key={round} {...props} restart={() => setRound((value) => value + 1)} />;
}

function QuizRun({ point, level, kind, questions, back: exit, title, pointIds, passages, restart }: QuizProps & { restart: () => void }) {
  const study = useGrammarStudy();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [page, setPage] = useState<'quiz' | 'result' | 'answers' | 'explanation'>('quiz');
  const [selected, select] = useState(0);
  const submitted = useRef(0);
  const [index, setIndex] = useState(0);
  const current = questions[index];
  const back: Href = exit ?? (point ? { pathname: '/grammar/exercises', params: { pointId: point.id } } : '/practice');

  useFocusEffect(useCallback(() => {
    if (page !== 'quiz') return;
    const timer = setInterval(() => setElapsed((time) => time + 1), 1000);
    return () => clearInterval(timer);
  }, [page]));

  function submit(answer: GrammarAnswer) {
    if (!current || submitted.current !== index) return;
    const next = [...grades];
    next[index] = { question: current, answer, right: gradeGrammar(current, answer) };
    submitted.current += 1;
    setGrades(next);
    if (index + 1 === questions.length) {
      if (point) study.record({ id: point.id, type: 'grade', total: next.length, correct: next.filter((grade) => grade.right).length });
      if (pointIds) {
        const totals = new Map<string, { correct: number; total: number }>();
        next.forEach((grade, index) => {
          const id = pointIds[index];
          if (!id) return;
          const count = totals.get(id) ?? { correct: 0, total: 0 };
          totals.set(id, { correct: count.correct + Number(grade.right), total: count.total + 1 });
        });
        for (const [id, count] of totals) study.record({ id, type: 'grade', ...count });
      }
      setPage('result');
    } else {
      setIndex(index + 1);
    }
  }

  function previousQuestion() {
    if (!index || submitted.current !== index) return;
    submitted.current -= 1;
    setIndex(index - 1);
  }

  if (page === 'explanation') return (
    <StudyScreen title="Giải thích" back={back} onBack={() => setPage('answers')}
      footer={<StudyActionButton label={selected + 1 < grades.length ? 'Tiếp theo' : 'Về danh sách đáp án'} icon={grammarIcons.next}
        onPress={() => selected + 1 < grades.length ? select((value) => value + 1) : setPage('answers')} />}>
      <Explanation grade={grades[selected]} index={selected} passage={passages?.[selected]} />
    </StudyScreen>
  );
  if (page === 'answers') return (
    <StudyScreen title="Xem lại đáp án" largeTitle back={back} onBack={() => setPage('result')}>
      <AnswerList grades={grades} open={(index) => { select(index); setPage('explanation'); }} />
    </StudyScreen>
  );
  if (page === 'result') return (
    <StudyScreen title="Kết quả luyện tập" largeTitle back={back}>
      <QuizResult grades={grades} restart={restart} review={() => setPage('answers')} />
      {(point || pointIds) && (!study.ready || study.saveError) && <StudyText>Chưa lưu được kết quả trên thiết bị.</StudyText>}
    </StudyScreen>
  );

  return current ? <QuestionStep key={index} question={current} index={index} total={questions.length} elapsed={elapsed}
    title={title ?? `Bài tập · ${grammarKindInfo[kind].title}`} point={point} level={level} passage={passages?.[index]} initial={grades[index]?.answer} previous={index > 0 ? previousQuestion : undefined} submit={submit} back={back} /> : null;
}

function QuestionStep({ question, point, level, index, total, elapsed, title, passage, initial, previous, submit, back }: {
  question: GrammarQuestion; point?: GrammarPoint; level?: GrammarLevel['level']; index: number; total: number; elapsed: number; title: string; passage?: string | null;
  initial?: GrammarAnswer; previous?: () => void; submit: (answer: GrammarAnswer) => void; back: Href;
}) {
  const [option, setOption] = useState<number | null>(typeof initial === 'number' ? initial : null);
  const [tiles, setTiles] = useState<number[]>(Array.isArray(initial) ? initial : []);
  const answer = question.type === 'order' ? tiles : option;
  const ready = question.type === 'order' ? tiles.length === question.tiles.length : option !== null;
  return (
    <StudyScreen title={title} back={back}
      footer={<View style={styles.line}>
        {previous && <StudyIconButton icon={previousIcon} onPress={previous} label="Câu trước" />}
        <View style={{ flex: 1 }}><StudyActionButton label={index + 1 === total ? 'Nộp bài' : 'Tiếp theo'} icon={grammarIcons.next}
          disabled={!ready} onPress={() => { if (answer !== null) submit(answer); }} /></View>
      </View>}>
      {!!passage && <StudyPanel><StudyText>{passage}</StudyText></StudyPanel>}
      <QuestionContent question={question} point={point} level={level} index={index} total={total} elapsed={elapsed}
        option={option} setOption={setOption} tiles={tiles} setTiles={setTiles} />
    </StudyScreen>
  );
}

function QuestionContent({ question, point, level, index, total, elapsed, option, setOption, tiles, setTiles }: {
  question: GrammarQuestion; point?: GrammarPoint; level?: GrammarLevel['level']; index: number; total: number; elapsed: number;
  option: number | null; setOption: (option: number) => void; tiles: number[]; setTiles: (tiles: number[]) => void;
}) {
  const colors = useStudyColors();
  const timer = [Math.floor(elapsed / 60), elapsed % 60].map((value) => String(value).padStart(2, '0')).join(':');
  const label = (point && grammarLevel(point)?.level) ?? level;
  const order = question.type === 'order' ? question.tiles.map((_, index) => (index + 1) % question.tiles.length) : [];
  return (
    <>
      <View style={styles.line}>
        <Text style={[styles.meta, { color: colors.title }]}>{index + 1} / {total}</Text>
        <StudyProgressBar fraction={index / total} style={styles.progress} />
        <StudyIcon name={grammarIcons.clock} color={colors.icon} size={14} />
        <Text style={[styles.meta, { color: colors.secondary }]}>{timer}</Text>
      </View>
      <StudyPanel style={styles.question}>
        <View style={styles.line}>
          {label && <GrammarBadge text={label} />}
          <StudyText heading>{point?.title ?? `Câu ${index + 1}`}</StudyText>
        </View>
        <StudyText>{question.type === 'order' ? 'Chạm các cụm từ để xếp thành câu.' : 'Chọn đáp án đúng.'}</StudyText>
        <Text selectable style={[styles.prompt, { color: colors.title }]}>{question.prompt}</Text>
      </StudyPanel>
      {question.type === 'order' ? (
        <>
          <StudyPanel>
            <StudyText heading>Câu của bạn</StudyText>
            {tiles.length === 0 && <StudyText>Chọn cụm từ ở bên dưới.</StudyText>}
            <View style={styles.tiles}>
              {tiles.map((key) => <Tile key={key} text={question.tiles[key]} onPress={() => setTiles(tiles.filter((tile) => tile !== key))} selected />)}
            </View>
          </StudyPanel>
          <View style={styles.tiles}>
            {order.map((key) => <Tile key={key} text={question.tiles[key]} disabled={tiles.includes(key)} onPress={() => setTiles([...tiles, key])} />)}
          </View>
        </>
      ) : (
        <View style={styles.options}>
          {question.choices.map((choice, step) => {
            const active = option === step;
            return (
              <Pressable key={choice} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setOption(step)}
                style={[styles.choice, { borderColor: active ? colors.icon : colors.divider, backgroundColor: active ? colors.iconFill : colors.surface }]}>
                <View style={[styles.radio, { borderColor: active ? colors.icon : colors.secondary }]}>
                  {active && <View style={[styles.dot, { backgroundColor: colors.icon }]} />}
                </View>
                <Text style={[styles.letter, { color: colors.title }]}>{letters[step]}</Text>
                <Text style={[styles.optionText, { color: colors.title }]}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}

function Tile({ text, onPress, disabled, selected }: { text: string; onPress: () => void; disabled?: boolean; selected?: boolean }) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={[styles.tile, { backgroundColor: selected ? colors.iconFill : colors.surface, opacity: disabled ? 0.35 : 1 }]}>
      <Text style={[styles.optionText, { color: colors.title }]}>{text}</Text>
    </Pressable>
  );
}

function QuizResult({ grades, restart, review }: { grades: Grade[]; restart: () => void; review: () => void }) {
  const colors = useStudyColors();
  const correct = grades.filter((grade) => grade.right).length;
  const fraction = correct / Math.max(1, grades.length);
  return (
    <>
      <View style={styles.result}>
        <View pointerEvents="none" style={[styles.wave, { backgroundColor: colors.iconFill }]} />
        <StudyRing progress={fraction} size={151}>
          <Text style={[styles.score, { color: colors.title }]}>{correct} / {grades.length}</Text>
          <StudyText>Độ chính xác</StudyText>
          <StudyText heading>{Math.round(fraction * 100)}%</StudyText>
        </StudyRing>
      </View>
      <StudyPanel>
        <View style={styles.line}><StudyIcon name={grammarIcons.check} color={colors.green} size={20} /><StudyText>Đúng</StudyText><View style={styles.progress} /><StudyText>{correct} câu</StudyText></View>
        <View style={styles.line}><StudyIcon name={grammarIcons.error} color="#CA3E49" size={20} /><StudyText>Sai</StudyText><View style={styles.progress} /><StudyText>{grades.length - correct} câu</StudyText></View>
      </StudyPanel>
      <StudyActionButton label="Xem lại đáp án" onPress={review} />
      <StudyActionButton secondary icon={grammarIcons.repeat} label="Làm lại" onPress={restart} />
    </>
  );
}

function AnswerList({ grades, open }: { grades: Grade[]; open: (index: number) => void }) {
  const right = grades.filter((grade) => grade.right).length;
  const good = `Đúng (${right})`;
  const bad = `Sai (${grades.length - right})`;
  const [filter, setFilter] = useState('Tất cả');
  const visible = grades.map((grade, index) => ({ grade, index })).filter(({ grade }) =>
    filter === 'Tất cả' || grade.right === (filter === good));
  return (
    <>
      <StudyPills options={['Tất cả', good, bad]} current={filter} onSelect={setFilter} />
      {visible.map(({ grade, index }) => <GrammarRow key={index} title={grade.right ? 'Đúng' : 'Sai'} titleBadge={String(index + 1)}
        icon={grade.right ? grammarIcons.check : grammarIcons.error} onPress={() => open(index)} />)}
      {!visible.length && <StudyPanel><StudyText>Không có câu nào trong nhóm này.</StudyText></StudyPanel>}
    </>
  );
}

function Explanation({ grade, index, passage }: { grade: Grade; index: number; passage?: string | null }) {
  const colors = useStudyColors();
  return (
    <>
      <StudyPanel>
        <View style={styles.line}><StudyIcon name={grade.right ? grammarIcons.check : grammarIcons.error}
          color={grade.right ? colors.green : '#CA3E49'} size={20} /><StudyText heading>{grade.right ? 'Đúng' : 'Sai'} · Câu {index + 1}</StudyText></View>
        {!!passage && <StudyText>{passage}</StudyText>}
        <Text selectable style={[styles.prompt, { color: colors.title }]}>{grade.question.prompt}</Text>
      </StudyPanel>
      {!grade.right && <AnswerBox label="Bạn chọn" answer={grammarAnswerText(grade.question, grade.answer)} wrong />}
      <AnswerBox label="Đáp án đúng" answer={grammarAnswerText(grade.question)} />
      {!!grade.question.explanation && <StudyPanel>
        <View style={styles.line}><StudyIcon name={grammarIcons.info} color={colors.icon} size={18} /><StudyText heading>Giải thích</StudyText></View>
        <StudyText>{grade.question.explanation}</StudyText>
      </StudyPanel>}
    </>
  );
}

function AnswerBox({ label, answer, wrong }: { label: string; answer: string; wrong?: boolean }) {
  return (
    <View style={[styles.answerBox, { backgroundColor: wrong ? '#FFE7E8' : '#E0F5E6' }]}>
      <Text selectable style={{ color: wrong ? '#883640' : '#205C3D', fontSize: 14, fontWeight: '700' }}>{label} · {answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  progress: { flex: 1, marginHorizontal: 4 },
  question: { gap: 9 },
  prompt: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  options: { gap: 6 },
  choice: { flexDirection: 'row', alignItems: 'center', minHeight: 43, borderRadius: 13, borderWidth: 1, padding: 7, gap: 8 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  letter: { fontSize: 13, fontWeight: '800' },
  optionText: { flexShrink: 1, fontSize: 15, fontWeight: '600' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { justifyContent: 'center', minHeight: 41, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  result: { minHeight: 205, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 18 },
  wave: { position: 'absolute', bottom: -50, left: '-20%', width: '150%', height: 110, borderRadius: '50%', transform: [{ rotate: '-12deg' }] },
  score: { fontSize: 26, fontWeight: '800' },
  answerBox: { borderRadius: 13, paddingHorizontal: 10, paddingVertical: 9 },
});
