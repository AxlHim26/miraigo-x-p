import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol } from '@/components/ui/study-icon';
import { useStudyColors } from '@/components/ui/study-screen';
import { listeningTitle, type ListeningLesson } from '@/features/listening/data/listening-lessons';

export {
  useStudyColors as useListeningColors,
  StudyScreen as ListeningFrame,
  StudyIconButton as ListeningIconButton,
  StudyPanel as ListeningPanel,
  StudyText as ListeningText,
  StudyPills as ListeningPills,
  StudyActionButton as ListeningActionButton,
  StudyProgressBar as ListeningProgressBar,
  StudyRing as ListeningRing,
} from '@/components/ui/study-screen';

export const listeningCovers = {
  fuji: require('@/assets/images/listening-fuji.jpg') as ImageSource,
  room: require('@/assets/images/lesson-room-cover.jpg') as ImageSource,
  headphones: require('@/assets/images/listening-headphones.jpg') as ImageSource,
};

export const listeningIcons = {
  back: studySymbol('chevron.left', 'chevron_left'),
  next: studySymbol('chevron.right', 'chevron_right'),
  play: studySymbol('play.fill', 'play_arrow'),
  pause: studySymbol('pause.fill', 'pause'),
  headphones: studySymbol('headphones', 'headphones'),
  topics: studySymbol('square.3.layers.3d', 'layers'),
  pencil: studySymbol('pencil', 'edit'),
  repeat: studySymbol('repeat', 'repeat'),
  heart: studySymbol('heart', 'favorite_border'),
  heartFill: studySymbol('heart.fill', 'favorite'),
  chart: studySymbol('chart.bar.xaxis', 'bar_chart'),
  check: studySymbol('checkmark', 'check'),
  close: studySymbol('xmark', 'close'),
  previousLine: studySymbol('backward.end', 'skip_previous'),
  nextLine: studySymbol('forward.end', 'skip_next'),
  transcript: studySymbol('doc.text', 'description'),
  target: studySymbol('scope', 'track_changes'),
  clock: studySymbol('clock', 'schedule'),
};

export function ListeningLessonRow({ lesson, subtitle, badge, done = false, onPress }: {
  lesson: ListeningLesson;
  subtitle: string;
  badge?: string;
  done?: boolean;
  onPress: () => void;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.lessonRow, {
      backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 2px 7px ${colors.shadow}`, opacity: pressed ? 0.65 : 1,
    }]}>
      <Image accessible={false} source={listeningCovers[lesson.cover]} style={styles.thumbnail} contentFit="cover" />
      <View style={styles.lessonCopy}>
        <Text style={[styles.lessonTitle, { color: colors.title }]}>{listeningTitle(lesson)}</Text>
        <Text style={[styles.lessonSubtitle, { color: colors.secondary }]}>{subtitle}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: done ? colors.surface : colors.iconFill }]}>
          <Text style={[styles.badgeText, { color: done ? colors.green : colors.blue }]}>{badge}</Text>
        </View>
      )}
      <View style={[styles.lessonIcon, { backgroundColor: done ? '#386B9B' : colors.iconFill }]}>
        <StudyIcon name={done ? listeningIcons.check : listeningIcons.play} color={done ? '#FFFFFF' : colors.icon} size={12} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lessonRow: { minHeight: 63, flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15 },
  thumbnail: { width: 60, height: 46, borderRadius: 10, backgroundColor: '#D4E0EC' },
  lessonCopy: { flex: 1, minWidth: 0, gap: 2 },
  lessonTitle: { fontSize: 14, fontWeight: '700' },
  lessonSubtitle: { fontSize: 12 },
  lessonIcon: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 7, maxWidth: '23%' },
  badgeText: { fontSize: 10, textAlign: 'center', fontWeight: '700' },
});
