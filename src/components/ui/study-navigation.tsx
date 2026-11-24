import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { studyColors } from '@/constants/study-colors';
import { StudyProgressBar, StudyRing, useStudyColors } from '@/components/ui/study-screen';

const fuji = require('@/assets/images/listening-fuji.jpg') as number;
const next = studySymbol('chevron.right', 'chevron_right');

export function StudyChevron({ size = 17, color }: { size?: number; color?: string }) {
  const colors = useStudyColors();
  return <StudyIcon name={next} size={size} color={color ?? colors.icon} />;
}

export function StudyCover({ title, subtitle, fraction, onPress }: {
  title: string; subtitle: string; fraction?: number; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title + ', ' + subtitle} onPress={onPress}
      style={({ pressed }) => [styles.cover, pressed && styles.pressed]}>
      <Image source={fuji} contentFit="cover" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.tint} />
      <View style={styles.copy}>
        <Text style={styles.coverTitle}>{title}</Text>
        <Text style={styles.coverSubtitle}>{subtitle}</Text>
        {fraction !== undefined && <StudyProgressBar fraction={fraction} tone="onBlue" style={styles.coverProgress} />}
      </View>
      {fraction === undefined ? <View style={styles.coverAction}><StudyChevron size={20} color={studyColors.light.icon} /></View> : (
        <StudyRing progress={fraction} size={65} tone="onBlue"><Text style={styles.percentage}>{Math.round(fraction * 100)}%</Text></StudyRing>
      )}
    </Pressable>
  );
}

export function StudyShortcut({ label, icon, onPress, disabled }: {
  label: string; icon: StudySymbol; onPress: () => void; disabled?: boolean;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.shortcut, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: '0px 4px 9px ' + colors.shadow }, (disabled || pressed) && styles.pressed]}>
      <StudyIcon name={icon} color={colors.icon} size={24} />
      <Text style={[styles.shortcutLabel, { color: colors.title }]}>{label}</Text>
    </Pressable>
  );
}

export function StudyLinkRow({ title, subtitle, icon, thumbnail, end, onPress }: {
  title: string; subtitle?: string; icon: StudySymbol; thumbnail?: ImageSource | number;
  end?: React.ReactNode; onPress: () => void;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="link" onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: '0px 4px 8px ' + colors.shadow }, pressed && styles.pressed]}>
      <View style={[styles.tile, { backgroundColor: colors.iconFill }, !!thumbnail && styles.thumbnail]}>
        {!!thumbnail && <Image source={thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />}
        <View style={!!thumbnail && styles.play}>
          <StudyIcon name={icon} color={thumbnail ? '#FFFFFF' : colors.icon} size={thumbnail ? 13 : 19} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.rowTitle, { color: colors.title }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.subtitle, { color: colors.secondary }]}>{subtitle}</Text> : null}
      </View>
      {end ?? <StudyChevron />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: { minHeight: 128, overflow: 'hidden', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 15, padding: 17, backgroundColor: '#4683B3' },
  tint: { ...StyleSheet.absoluteFill, backgroundImage: 'linear-gradient(90deg, rgba(23,104,161,.68), rgba(64,136,197,.12))' },
  coverTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  coverSubtitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  coverProgress: { marginTop: 5, maxWidth: 205 },
  coverAction: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F8FD', alignItems: 'center', justifyContent: 'center' },
  percentage: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  shortcut: { flex: 1, minHeight: 72, paddingHorizontal: 3, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth },
  shortcutLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  row: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 8, minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tile: { width: 40, height: 39, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbnail: { width: 62, height: 43, borderRadius: 9 },
  play: { width: 25, height: 25, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12 },
  pressed: { opacity: 0.65 },
});
