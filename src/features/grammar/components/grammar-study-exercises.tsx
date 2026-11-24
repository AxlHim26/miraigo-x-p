import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyActionButton, StudyIconButton, StudyPanel, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { grammarPointHref } from '@/features/grammar/components/grammar-study-browser';
import { GrammarQuiz } from '@/features/grammar/components/grammar-study-quiz';
import { GrammarBadge, GrammarRow, grammarIcons } from '@/features/grammar/components/grammar-study-ui';
import { grammarExercises, grammarKindInfo, grammarKinds, grammarLevel, grammarPoint, type GrammarKind } from '@/features/grammar/data/grammar-exercises';
import type { GrammarPoint } from '@/features/grammar/types/catalog';

export function GrammarExercisesScreen() {
  const { pointId } = useLocalSearchParams<{ pointId?: string }>();
  const point = grammarPoint(pointId);
  if (point) return <ExerciseMenu key={point.id} point={point} />;
  return <StudyScreen title="Bài tập" back="/grammar"><StudyPanel><StudyText>Không tìm thấy mẫu bài tập.</StudyText></StudyPanel></StudyScreen>;
}

function ExerciseMenu({ point }: { point: GrammarPoint }) {
  const router = useRouter();
  return (
    <StudyScreen title="Bài tập" largeTitle back={grammarPointHref(point.id)}
      action={<StudyIconButton icon={grammarIcons.sparkles} label="Tạo bài ngữ pháp bằng AI"
        onPress={() => router.push({ pathname: '/grammar/create', params: { pointId: point.id } })} />}>
      <MenuContent point={point} />
    </StudyScreen>
  );
}

function MenuContent({ point }: { point: GrammarPoint }) {
  const router = useRouter();
  const colors = useStudyColors();
  const [selected, setSelected] = useState<GrammarKind>('choice');
  const choices = grammarKinds.map((type) => ({ type, count: grammarExercises(point, type).length }));
  const count = choices.find((item) => item.type === selected)?.count ?? 0;
  const level = grammarLevel(point);

  return (
    <>
      <StudyPanel>
        <View style={styles.heading}>
          {!!level && <GrammarBadge text={level.level} />}
          <Text style={[styles.title, { color: colors.title }]}>{point.title}</Text>
        </View>
        <StudyText>{point.structure}</StudyText>
      </StudyPanel>
      <StudyText heading>Nội dung bài tập</StudyText>
      {choices.map(({ type, count: questions }) => (
        <GrammarRow key={type} title={grammarKindInfo[type].title} icon={type === 'choice' ? grammarIcons.quiz : type === 'order' ? grammarIcons.list : grammarIcons.target}
          subtitle={questions ? `${questions} câu · ${grammarKindInfo[type].description}` : 'Có thể tạo bằng AI'}
          end={type === selected ? grammarIcons.check : grammarIcons.circle} onPress={() => setSelected(type)} />
      ))}
      <View style={styles.actions}>
        <StudyActionButton icon={count ? grammarIcons.play : grammarIcons.sparkles} label={count ? 'Bắt đầu làm bài' : 'Tạo bài bằng AI'}
          onPress={() => count
            ? router.push({ pathname: '/grammar/session', params: { pointId: point.id, type: selected } })
            : router.push({ pathname: '/grammar/create', params: { pointId: point.id, type: selected } })} />
      </View>
    </>
  );
}

export function GrammarSession() {
  const { pointId, type } = useLocalSearchParams<{ pointId?: string; type?: string }>();
  const point = grammarPoint(pointId);
  const kind = grammarKinds.find((candidate) => candidate === type) ?? 'choice';
  const questions = point ? grammarExercises(point, kind) : [];
  if (point && questions.length) return <GrammarQuiz key={`${point.id}:${kind}`} point={point} kind={kind} questions={questions} />;
  return (
    <StudyScreen title="Bài tập" back="/grammar"><StudyPanel><StudyText>Chưa có câu hỏi cho bài tập này.</StudyText></StudyPanel></StudyScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, fontWeight: '800', flex: 1 },
  actions: { marginTop: 15 },
});
