import type { PropsWithChildren, ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { StudyChevron } from '@/components/ui/study-navigation';
import { StudyIconButton, useStudyColors } from '@/components/ui/study-screen';
import { studyColors } from '@/constants/study-colors';

const closeIcon = studySymbol('xmark', 'close');
const lightTones = {
  gold: { fill: '#FFF4DF', ink: '#D88B08' },
  coral: { fill: '#FFEAE7', ink: '#E95D30' },
  danger: { fill: '#FCE9E9', ink: '#CF232F' },
};
const darkTones = {
  gold: { fill: '#4D3A24', ink: '#FFD174' },
  coral: { fill: '#4E322F', ink: '#FF9C86' },
  danger: { fill: '#4F2C36', ink: '#FFA2AD' },
};

type GlyphTone = 'blue' | keyof typeof lightTones;

export function ProfileGlyph({ icon, tone = 'blue', size = 42 }: { icon: StudySymbol; tone?: GlyphTone; size?: number }) {
  const colors = useStudyColors();
  const { fill, ink } = tone === 'blue' ? { fill: colors.iconFill, ink: colors.icon } : (colors === studyColors.dark ? darkTones : lightTones)[tone];
  return (
    <View style={[styles.glyph, { width: size, height: size, borderRadius: size / 2, backgroundColor: fill }]}>
      <StudyIcon name={icon} size={size * 0.54} color={ink} />
    </View>
  );
}

export function ProfileMenuRow({ title, subtitle, value, icon, tone = 'blue', end, children, onPress }: PropsWithChildren<{
  title: string; subtitle?: string; value?: string; icon: StudySymbol; tone?: GlyphTone; end?: ReactNode; onPress?: () => void;
}>) {
  const colors = useStudyColors();
  const dangerous = tone === 'danger';
  const ink = dangerous ? (colors === studyColors.dark ? darkTones.danger.ink : lightTones.danger.ink) : colors.title;
  const appearance = { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 4px 11px ${colors.shadow}` };
  const body = (
    <>
      <View style={styles.rowContent}>
        <ProfileGlyph icon={icon} tone={tone} />
        <View style={styles.rowCopy}>
          <Text style={[styles.title, { color: ink }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.subtitle, { color: dangerous ? ink : colors.secondary }]}>{subtitle}</Text>}
        </View>
        {!!value && <Text style={[styles.value, { color: colors.text }]}>{value}</Text>}
        {end ?? (onPress && <StudyChevron size={15} color={dangerous ? ink : undefined} />)}
      </View>
      {children && <View style={styles.rowDetail}>{children}</View>}
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, appearance, pressed && styles.pressed]}>
      {body}
    </Pressable>
  ) : <View style={[styles.row, appearance]}>{body}</View>;
}

export function ProfileAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.action, (pressed || disabled) && styles.pressed]}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function ProfileTrack({ progress }: { progress: number }) {
  const colors = useStudyColors();
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { backgroundColor: colors.track }]}>
      <View style={[styles.trackFill, { width: `${percent}%` }]} />
    </View>
  );
}

export function ProfileSheet({ title, close, children }: PropsWithChildren<{ title: string; close: () => void }>) {
  const colors = useStudyColors();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.modal}>
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.sheetHeader}>
            <Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.title }]}>{title}</Text>
            <StudyIconButton icon={closeIcon} label="Đóng" onPress={close} size={38} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  glyph: { alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 57, paddingHorizontal: 12, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, justifyContent: 'center' },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  rowDetail: { marginTop: 3, paddingLeft: 51, paddingVertical: 3 },
  title: { fontSize: 14, fontWeight: '700', letterSpacing: -0.18 },
  subtitle: { fontSize: 12, lineHeight: 16 },
  value: { fontSize: 13, fontWeight: '500', flexShrink: 1, maxWidth: '39%', textAlign: 'right' },
  pressed: { opacity: 0.64 },
  action: { minHeight: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: studyColors.light.icon,
    backgroundImage: 'linear-gradient(180deg, #5DACF6, #2488E1 48%, #0869C6)' },
  actionLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  track: { height: 7, borderRadius: 8, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 8, backgroundColor: studyColors.light.icon, backgroundImage: 'linear-gradient(90deg, #166FCB, #42A6F9)' },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#10284655' },
  sheet: { width: '100%', maxWidth: 550, maxHeight: '81%', alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 15, paddingBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  sheetContent: { gap: 8, paddingBottom: 12 },
});
