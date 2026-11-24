import { Image } from 'expo-image';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { StudyIconButton, StudyPanel, useStudyColors } from '@/components/ui/study-screen';

export const vocabularyArt = require('@/assets/images/listening-fuji.jpg') as number;

export const vocabularyIcons = {
  search: studySymbol('magnifyingglass', 'search'),
  next: studySymbol('chevron.right', 'chevron_right'),
  options: studySymbol('slider.horizontal.3', 'tune'),
  plus: studySymbol('plus', 'add'),
  repeat: studySymbol('arrow.clockwise', 'refresh'),
  flashcards: studySymbol('rectangle.on.rectangle', 'style'),
  target: studySymbol('scope', 'track_changes'),
  book: studySymbol('book', 'menu_book'),
  topic: studySymbol('folder', 'folder'),
  speaker: studySymbol('speaker.wave.2', 'volume_up'),
  check: studySymbol('checkmark', 'check'),
  close: studySymbol('xmark', 'close'),
  heart: studySymbol('heart', 'favorite_border'),
  heartFill: studySymbol('heart.fill', 'favorite'),
  list: studySymbol('list.bullet', 'list'),
  play: studySymbol('play.fill', 'play_arrow'),
  pause: studySymbol('pause.fill', 'pause'),
  example: studySymbol('text.bubble', 'chat_bubble_outline'),
  clock: studySymbol('clock', 'schedule'),
  star: studySymbol('star', 'star_outline'),
  warning: studySymbol('exclamationmark.triangle', 'warning'),
  eye: studySymbol('eye', 'visibility'),
  chart: studySymbol('chart.bar.xaxis', 'bar_chart'),
};

export function VocabularyRow({ title, subtitle, icon, onPress, last }: {
  title: string;
  subtitle?: string;
  icon: StudySymbol;
  onPress: () => void;
  last?: React.ReactNode;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [
      styles.row,
      { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 9px ${colors.shadow}`, opacity: pressed ? 0.7 : 1 },
    ]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.iconFill }]}>
        <StudyIcon name={icon} color={colors.icon} size={20} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.title }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSubtitle, { color: colors.secondary }]}>{subtitle}</Text>}
      </View>
      {last ?? <StudyIcon name={vocabularyIcons.next} color={colors.icon} size={14} />}
    </Pressable>
  );
}

export function VocabularyInfo({ title, icon, children }: PropsWithChildren<{ title: string; icon: StudySymbol }>) {
  const colors = useStudyColors();
  return (
    <StudyPanel style={styles.info}>
      <View style={[styles.infoIcon, { backgroundColor: colors.iconFill }]}>
        <StudyIcon name={icon} color={colors.icon} size={17} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.infoTitle, { color: colors.title }]}>{title}</Text>
        {children}
      </View>
    </StudyPanel>
  );
}

export function VocabularyWordCard({ term, reading, play, playing, children }: PropsWithChildren<{
  term: string;
  reading?: string | null;
  play: () => void;
  playing?: boolean;
}>) {
  const colors = useStudyColors();
  return (
    <StudyPanel style={styles.wordCard}>
      <Image accessible={false} source={vocabularyArt} contentFit="cover" style={styles.cardArt} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        backgroundImage: `linear-gradient(180deg, ${colors.background} 32%, transparent 85%)`,
      }]} />
      <View style={styles.cardAudio}>
        <StudyIconButton icon={playing ? vocabularyIcons.pause : vocabularyIcons.speaker} label={playing ? 'Dừng phát' : 'Nghe phát âm'} onPress={play} />
      </View>
      <Text selectable style={[styles.term, { color: colors.title }]}>{term}</Text>
      {reading && reading !== term && <Text selectable style={[styles.reading, { color: colors.secondary }]}>{reading}</Text>}
      {children}
    </StudyPanel>
  );
}

export function VocabularyText({ children }: PropsWithChildren) {
  const colors = useStudyColors();
  return <Text selectable style={[styles.value, { color: colors.secondary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: { minHeight: 57, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7, paddingHorizontal: 10 },
  rowIcon: { height: 38, width: 38, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSubtitle: { fontSize: 12, lineHeight: 16 },
  info: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', padding: 9, borderRadius: 15 },
  infoIcon: { width: 32, height: 32, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 12, fontWeight: '700' },
  wordCard: { width: '100%', minHeight: 203, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 46, paddingTop: 45, paddingBottom: 28 },
  cardArt: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '65%', opacity: 0.62 },
  cardAudio: { position: 'absolute', top: 9, right: 9 },
  term: { fontSize: 36, lineHeight: 46, fontWeight: '800', textAlign: 'center' },
  reading: { fontSize: 17, fontWeight: '500', textAlign: 'center' },
  value: { fontSize: 14, lineHeight: 19 },
});
