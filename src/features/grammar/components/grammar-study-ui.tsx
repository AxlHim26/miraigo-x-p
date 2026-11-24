import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { StudyProgressBar, useStudyColors } from '@/components/ui/study-screen';

export const fujiCover = require('@/assets/images/listening-fuji.jpg') as number;
export const grammarIcons = {
  book: studySymbol('book', 'menu_book'),
  quiz: studySymbol('pencil', 'edit'),
  star: studySymbol('star', 'star_outline'),
  saved: studySymbol('bookmark', 'bookmark_border'),
  savedFill: studySymbol('bookmark.fill', 'bookmark'),
  repeat: studySymbol('arrow.clockwise', 'refresh'),
  search: studySymbol('magnifyingglass', 'search'),
  play: studySymbol('play.fill', 'play_arrow'),
  pause: studySymbol('pause.fill', 'pause'),
  next: studySymbol('chevron.right', 'chevron_right'),
  down: studySymbol('chevron.down', 'expand_more'),
  circle: studySymbol('circle', 'radio_button_unchecked'),
  check: studySymbol('checkmark.circle.fill', 'check_circle'),
  error: studySymbol('xmark.circle.fill', 'cancel'),
  info: studySymbol('info.circle', 'info'),
  layers: studySymbol('square.3.layers.3d', 'layers'),
  audio: studySymbol('speaker.wave.2', 'volume_up'),
  list: studySymbol('list.bullet', 'format_list_bulleted'),
  sparkles: studySymbol('sparkles', 'auto_awesome'),
  clock: studySymbol('clock', 'schedule'),
  target: studySymbol('scope', 'track_changes'),
};

export function GrammarBadge({ text }: { text: string }) {
  const colors = useStudyColors();
  return <Text style={[styles.badge, { color: colors.blue, backgroundColor: colors.iconFill }]}>{text}</Text>;
}

export function GrammarRow({ title, subtitle, titleBadge, icon, end, progress, onPress }: {
  title: string; subtitle?: string; titleBadge?: string; icon?: StudySymbol; end?: StudySymbol; progress?: number; onPress: () => void;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.row, {
      backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 2px 8px ${colors.shadow}`, opacity: pressed ? 0.67 : 1,
    }]}>
      {titleBadge && <GrammarBadge text={titleBadge} />}
      {icon && <View style={[styles.icon, { backgroundColor: colors.iconFill }]}><StudyIcon name={icon} color={colors.icon} size={18} /></View>}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.secondary }]}>{subtitle}</Text>}
        {!!progress && <StudyProgressBar fraction={progress} style={styles.track} />}
      </View>
      <StudyIcon name={end ?? grammarIcons.next} color={colors.icon} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 9, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, fontSize: 13, fontWeight: '700' },
  row: { minHeight: 58, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 9 },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontSize: 15, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 16 },
  track: { height: 5, marginTop: 2 },
});
