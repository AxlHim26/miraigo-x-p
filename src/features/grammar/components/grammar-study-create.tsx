import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { StudyActionButton, StudyPanel, StudyPills, StudyScreen, StudyText } from '@/components/ui/study-screen';
import { GrammarQuiz } from '@/features/grammar/components/grammar-study-quiz';
import { GrammarRow, grammarIcons } from '@/features/grammar/components/grammar-study-ui';
import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';
import { grammarKindInfo, grammarKinds, grammarLevel, grammarPoint, type GrammarKind, type GrammarQuestion } from '@/features/grammar/data/grammar-exercises';
import { generateGrammarDeck } from '@/features/grammar/services/grammar-ai';
import type { GrammarLevel } from '@/features/grammar/types/catalog';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const counts = ['5', '10', '15', '20'] as const;

export function GrammarCreator() {
  const { pointId, type } = useLocalSearchParams<{ pointId?: string; type?: string }>();
  const initial = grammarPoint(pointId) ?? grammarPoints[0];
  const [level, setLevel] = useState<GrammarLevel['level']>(grammarLevel(initial)?.level ?? 'N5');
  const [point, setPoint] = useState(initial);
  const [kind, setKind] = useState<GrammarKind>(grammarKinds.find((item) => item === type) ?? 'choice');
  const [count, setCount] = useState<typeof counts[number]>('10');
  const [expanded, setExpanded] = useState<'topic' | 'type' | null>(null);
  const [limit, setLimit] = useState(12);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [questions, setQuestions] = useState<GrammarQuestion[] | null>(null);
  const task = useRef<AbortController | null>(null);
  const available = grammarPoints.filter((item) => item.levelId === grammarLevels.find((definition) => definition.level === level)?.id);

  useFocusEffect(useCallback(() => () => {
    const current = task.current;
    task.current = null;
    current?.abort();
    if (current) setPending(false);
  }, []));

  async function create() {
    if (task.current) return;
    const controller = new AbortController();
    task.current = controller;
    const timer = setTimeout(() => controller.abort(), 75_000);
    setPending(true);
    setError(false);
    setExpanded(null);
    try {
      const deck = await generateGrammarDeck(level, point, kind, Number(count), controller.signal);
      if (task.current === controller && !controller.signal.aborted) setQuestions(deck);
    } catch {
      if (task.current === controller) setError(true);
    } finally {
      clearTimeout(timer);
      if (task.current === controller) {
        task.current = null;
        setPending(false);
      }
    }
  }

  if (questions) return <GrammarQuiz point={point} kind={kind} questions={questions} back="/grammar" />;

  return (
    <StudyScreen title="Tạo bài ngữ pháp bằng AI" back="/grammar"
      footer={<StudyActionButton label={pending ? 'AI đang tạo bài…' : 'Tạo bài'} icon={grammarIcons.sparkles} disabled={pending} onPress={() => void create()} />}>
      <StudyPanel><StudyText>Chọn mẫu ngữ pháp để AI tạo bài tập theo trình độ của bạn.</StudyText></StudyPanel>
      <StudyText heading>Cấp độ</StudyText>
      <StudyPills options={levels} current={level} onSelect={(item) => {
        if (pending) return;
        const definition = grammarLevels.find((entry) => entry.level === item);
        const first = grammarPoints.find((entry) => entry.levelId === definition?.id);
        if (first) { setLevel(item); setPoint(first); setLimit(12); }
      }} />
      <StudyText heading>Chủ đề ngữ pháp</StudyText>
      <GrammarRow title={point.title} icon={grammarIcons.list} end={grammarIcons.down} onPress={() => { if (!pending) setExpanded((value) => value === 'topic' ? null : 'topic'); }} />
      {expanded === 'topic' && available.slice(0, limit).map((item) => <GrammarRow key={item.id} title={item.title}
        onPress={() => { setPoint(item); setExpanded(null); setLimit(12); }} />)}
      {expanded === 'topic' && available.length > limit && <StudyActionButton secondary label="Xem thêm mẫu" onPress={() => setLimit((value) => value + 12)} />}
      <StudyText heading>Số câu hỏi</StudyText>
      <StudyPills options={counts} current={count} onSelect={(value) => { if (!pending) setCount(value); }} />
      <StudyText heading>Loại bài tập</StudyText>
      <GrammarRow title={grammarKindInfo[kind].title} icon={grammarIcons.layers} end={grammarIcons.down}
        onPress={() => { if (!pending) setExpanded((value) => value === 'type' ? null : 'type'); }} />
      {expanded === 'type' && grammarKinds.map((item) => <GrammarRow key={item} title={grammarKindInfo[item].title}
        onPress={() => { setKind(item); setExpanded(null); }} />)}
      {error && <StudyPanel><StudyText>Chưa tạo được bài. Hãy kiểm tra dịch vụ AI rồi thử lại.</StudyText></StudyPanel>}
    </StudyScreen>
  );
}
