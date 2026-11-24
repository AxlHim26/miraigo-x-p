import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyIcon, type StudySymbol } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { grammarPointHref } from '@/features/grammar/components/grammar-study-browser';
import { GrammarBadge, GrammarRow, grammarIcons } from '@/features/grammar/components/grammar-study-ui';
import { grammarPoints } from '@/features/grammar/data/catalog';
import { grammarLevel, grammarPoint } from '@/features/grammar/data/grammar-exercises';
import { useGrammarStudy } from '@/features/grammar/hooks/use-grammar-study';
import type { GrammarPoint } from '@/features/grammar/types/catalog';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

const tabs = ['Tổng quan', 'Ví dụ', 'Lưu ý', 'Mở rộng'] as const;

export function GrammarPointScreen() {
  const { pointId } = useLocalSearchParams<{ pointId?: string }>();
  const point = grammarPoint(pointId);
  return point ? <GrammarLesson key={point.id} point={point} /> : (
    <StudyScreen title="Ngữ pháp" back="/grammar"><StudyPanel><StudyText>Không tìm thấy mẫu ngữ pháp.</StudyText></StudyPanel></StudyScreen>
  );
}

function GrammarLesson({ point }: { point: GrammarPoint }) {
  const study = useGrammarStudy();
  const { ready, record } = study;
  const entry = study.state.entries[point.id];
  const level = grammarLevel(point);
  const [tab, setTab] = useState<typeof tabs[number]>('Tổng quan');

  useFocusEffect(useCallback(() => {
    if (ready) record({ id: point.id, type: 'open' });
  }, [point.id, ready, record]));

  return (
    <StudyScreen title={point.title} back={level ? { pathname: '/grammar/[levelId]', params: { levelId: level.id } } : '/grammar'}
      action={<StudyIconButton icon={entry?.saved ? grammarIcons.savedFill : grammarIcons.saved} label={entry?.saved ? 'Bỏ lưu mẫu' : 'Lưu mẫu'}
        selected={entry?.saved} disabled={!ready} onPress={() => record({ id: point.id, type: 'favorite' })} />}>
      <StudyPills options={tabs} current={tab} onSelect={(next) => {
        setTab(next);
        if (next === 'Ví dụ' && !entry?.examples) record({ id: point.id, type: 'examples' });
      }} />
      {tab === 'Tổng quan' && <LessonOverview point={point} />}
      {tab === 'Ví dụ' && <ExampleList point={point} />}
      {tab === 'Lưu ý' && <LessonNotes point={point} />}
      {tab === 'Mở rộng' && <RelatedGrammar point={point} />}
      <LessonActions point={point} completed={entry?.completed ?? false} canSave={ready}
        complete={() => record({ id: point.id, type: 'learned' })} />
      {study.readError && <StudyActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
      {study.saveError && <StudyText>Chưa lưu được thay đổi trên thiết bị.</StudyText>}
    </StudyScreen>
  );
}

function LessonOverview({ point }: { point: GrammarPoint }) {
  const colors = useStudyColors();
  const level = grammarLevel(point);
  return (
    <>
      <StudyPanel style={styles.hero}>
        <View pointerEvents="none" style={[styles.wave, { backgroundColor: colors.iconFill }]} />
        {!!level && <GrammarBadge text={level.level} />}
        <Text selectable style={[styles.heading, { color: colors.title }]}>{point.title}</Text>
      </StudyPanel>
      <InfoCard heading="Ý nghĩa" icon={grammarIcons.target}><StudyText>{point.meaning}</StudyText></InfoCard>
      <InfoCard heading="Cấu trúc" icon={grammarIcons.layers}>
        <View style={[styles.formula, { backgroundColor: colors.iconFill }]}>
          <Text selectable style={[styles.formulaText, { color: colors.blue }]}>{point.structure}</Text>
        </View>
      </InfoCard>
      {(point.notes || point.id === 'n5-01') && <InfoCard heading="Giải thích" icon={grammarIcons.info}>
        <StudyText>{point.notes ?? 'N1 là chủ đề của câu. N2 nêu tên, nghề nghiệp hoặc đặc điểm của N1. です đứng cuối câu để diễn đạt lịch sự.'}</StudyText>
      </InfoCard>}
    </>
  );
}

function InfoCard({ icon, heading, children }: PropsWithChildren<{ icon: StudySymbol; heading: string }>) {
  const colors = useStudyColors();
  return (
    <StudyPanel>
      <View style={styles.infoHeading}><StudyIcon name={icon} color={colors.icon} size={19} /><StudyText heading>{heading}</StudyText></View>
      {children}
    </StudyPanel>
  );
}

function ExampleList({ point }: { point: GrammarPoint }) {
  const colors = useStudyColors();
  const speech = useStudySpeech(point.examples.map((example) => example.japanese));
  return (
    <>
      <StudyText heading>Ví dụ</StudyText>
      {point.examples.map((example, index) => {
        const active = speech.playing && speech.index === index;
        return (
          <StudyPanel key={index} style={styles.example}>
            <StudyIconButton size={38} icon={active ? grammarIcons.pause : grammarIcons.audio}
              label={active ? 'Dừng phát' : `Nghe ví dụ ${index + 1}`} onPress={active ? speech.stop : () => void speech.play(index)} />
            <View style={styles.exampleText}>
              <Text selectable style={[styles.jp, { color: colors.title }]}>{example.japanese}</Text>
              {example.reading && example.reading !== example.japanese && <StudyText>{example.reading}</StudyText>}
              <StudyText>{example.vietnamese}</StudyText>
            </View>
          </StudyPanel>
        );
      })}
      {speech.failed && <StudyText>Thiết bị chưa phát được giọng tiếng Nhật.</StudyText>}
      {(point.notes || point.id === 'n5-01') && <LessonNotes point={point} />}
    </>
  );
}

function LessonNotes({ point }: { point: GrammarPoint }) {
  return (
    <InfoCard heading="Lưu ý" icon={grammarIcons.info}>
      <StudyText>{point.notes ?? (point.id === 'n5-01'
        ? '「は」là trợ từ nêu chủ đề, được phát âm là わ khi dùng với chức năng này. 「です」là đuôi câu lịch sự.'
        : 'Đọc các ví dụ để xem mẫu câu trong ngữ cảnh.')}</StudyText>
    </InfoCard>
  );
}

function RelatedGrammar({ point }: { point: GrammarPoint }) {
  const router = useRouter();
  const related = grammarPoints.filter((item) => item.id !== point.id && item.levelId === point.levelId && item.lesson === point.lesson).slice(0, 6);
  return (
    <>
      <StudyText heading>Mẫu cùng bài</StudyText>
      {related.map((item) => <GrammarRow key={item.id} title={item.title} subtitle={item.meaning} icon={grammarIcons.book}
        onPress={() => router.push(grammarPointHref(item.id))} />)}
      {!related.length && <StudyPanel><StudyText>Chưa có mẫu liên quan trong bài này.</StudyText></StudyPanel>}
    </>
  );
}

function LessonActions({ point, canSave, completed, complete }: { point: GrammarPoint; canSave: boolean; completed: boolean; complete: () => void }) {
  const router = useRouter();
  return (
    <>
      <StudyActionButton icon={grammarIcons.quiz} label="Luyện bài tập" onPress={() => router.push({ pathname: '/grammar/exercises', params: { pointId: point.id } })} />
      {!completed && <StudyActionButton secondary label="Đánh dấu đã học" disabled={!canSave} onPress={complete} />}
      {completed && <StudyText>Đã hoàn thành mẫu ngữ pháp này.</StudyText>}
    </>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 105, justifyContent: 'center', overflow: 'hidden' },
  heading: { fontSize: 25, fontWeight: '800' },
  wave: { position: 'absolute', bottom: -45, right: '-25%', width: '120%', height: 112, borderRadius: '50%', transform: [{ rotate: '-18deg' }] },
  infoHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  formula: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8 },
  formulaText: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  example: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exampleText: { flex: 1, minWidth: 0, gap: 2 },
  jp: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
});
