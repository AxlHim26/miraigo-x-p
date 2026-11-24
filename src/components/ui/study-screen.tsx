import { useRouter, type Href } from 'expo-router';
import { createContext, useContext, type ComponentRef, type PropsWithChildren, type ReactNode, type Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLearnerPalette } from '@/components/ui/learner-glass';
import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { studyColors } from '@/constants/study-colors';

const backIcon = studySymbol('chevron.left', 'chevron_left');
const Palette = createContext(studyColors.light);

export const useStudyColors = () => useContext(Palette);

export function StudyScreen({ title, hint, subtitle, titleAccessory, back, onBack, action, children, footer, restartKey, scrollRef, onContentSizeChange, largeTitle = false }: PropsWithChildren<{
  title: string;
  hint?: string;
  subtitle?: string;
  titleAccessory?: ReactNode;
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
  onContentSizeChange?: () => void;
  back?: Href;
  onBack?: () => void;
  action?: ReactNode;
  footer?: ReactNode;
  restartKey?: string | number;
  largeTitle?: boolean;
}>) {
  const router = useRouter();
  const { dark } = useLearnerPalette();
  const colors = studyColors[dark ? 'dark' : 'light'];
  return (
    <Palette.Provider value={colors}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, hint && styles.homeHeader]}>
          {back && (
            <StudyIconButton icon={backIcon} label="Quay lại" onPress={() => {
              if (onBack) onBack();
              else if (router.canGoBack()) router.back();
              else router.replace(back);
            }} />
          )}
          {!back && action && !hint && <View style={styles.headerSpacer} />}
          {titleAccessory}
          <View style={styles.headerCopy}>
            {hint && <Text style={[styles.hint, { color: colors.secondary }]}>{hint}</Text>}
            <Text
              accessibilityRole="header"
              style={[styles.headerTitle, { color: colors.title }, !hint && !titleAccessory && !largeTitle && styles.centered, largeTitle && styles.largeTitle]}
              numberOfLines={2}>
              {title}
            </Text>
            {!!subtitle && <Text style={[styles.hint, !hint && !titleAccessory && styles.subtitle, { color: colors.secondary }]}>{subtitle}</Text>}
          </View>
          {action ?? (back && <View style={styles.headerSpacer} />)}
        </View>
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={onContentSizeChange}
          contentInsetAdjustmentBehavior="automatic"
          key={restartKey}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.body}>
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </Palette.Provider>
  );
}

export function StudyIconButton({ icon, label, onPress, selected, primary, disabled, size = 42 }: {
  icon: StudySymbol;
  label: string;
  onPress: () => void;
  selected?: boolean;
  primary?: boolean;
  disabled?: boolean;
  size?: number;
}) {
  const colors = useStudyColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: primary ? studyColors.light.icon : selected ? colors.iconFill : colors.surface,
          borderColor: primary ? studyColors.light.icon : colors.border,
          opacity: pressed || disabled ? 0.55 : 1,
        },
      ]}>
      <StudyIcon name={icon} color={primary ? '#FFFFFF' : colors.icon} size={primary ? 25 : 19} />
    </Pressable>
  );
}

export function StudyPanel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const colors = useStudyColors();
  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 10px ${colors.shadow}` }, style]}>
      {children}
    </View>
  );
}

export function StudyText({ children, heading = false }: PropsWithChildren<{ heading?: boolean }>) {
  const colors = useStudyColors();
  return (
    <Text
      accessibilityRole={heading ? 'header' : undefined}
      style={[heading ? styles.sectionTitle : styles.paragraph, { color: heading ? colors.title : colors.secondary }]}>
      {children}
    </Text>
  );
}

export function StudyPills<T extends string>({ options, current, onSelect }: {
  options: readonly T[];
  current: T;
  onSelect: (option: T) => void;
}) {
  const colors = useStudyColors();
  return (
    <View style={styles.pills}>
      {options.map((option) => {
        const selected = option === current;
        return (
          <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected }}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [styles.pill, {
              backgroundColor: selected ? '#373F49' : colors.surface,
              opacity: pressed ? 0.72 : 1,
              borderColor: selected ? '#373F49' : colors.border,
            }]}>
            <Text style={[styles.pillText, { color: selected ? '#FFFFFF' : colors.text }]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StudyActionButton({ label, onPress, secondary = false, disabled = false, icon, tone = 'blue' }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: StudySymbol;
  tone?: 'blue' | 'ink';
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.action, { backgroundColor: secondary ? colors.iconFill : tone === 'ink' ? '#363B43' : studyColors.light.icon, opacity: pressed || disabled ? 0.5 : 1 }]}>
      {icon && <StudyIcon name={icon} color={secondary ? colors.icon : '#FFFFFF'} size={17} />}
      <Text style={[styles.actionLabel, { color: secondary ? colors.blue : '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function StudyProgressBar({ fraction, style, tone = 'surface' }: {
  fraction: number; style?: StyleProp<ViewStyle>; tone?: 'surface' | 'onBlue';
}) {
  const colors = useStudyColors();
  const percent = Math.max(0, Math.min(100, fraction * 100));
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={[styles.track, { backgroundColor: tone === 'onBlue' ? '#FFFFFF55' : colors.track }, style]}>
      <View style={[styles.fill, { backgroundColor: tone === 'onBlue' ? '#FFFFFF' : colors.icon, width: `${percent}%` }]} />
    </View>
  );
}

export function StudyRing({ progress, size = 83, tone = 'surface', children }: PropsWithChildren<{
  progress: number; size?: number; tone?: 'surface' | 'onBlue';
}>) {
  const colors = useStudyColors();
  const borderWidth = size > 110 ? 10 : size <= 60 ? 4 : 7;
  const half = size / 2;
  const angle = Math.max(0, Math.min(1, progress)) * 360;
  const shape = { width: size, height: size, borderRadius: half, borderWidth };
  const fill = tone === 'onBlue' ? '#FFFFFF' : colors.icon;
  const arc = { borderTopColor: fill, borderRightColor: fill, borderBottomColor: 'transparent', borderLeftColor: 'transparent' };
  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <View style={[styles.ringBorder, shape, { borderColor: tone === 'onBlue' ? '#FFFFFF55' : colors.track }]} />
      {angle > 0 && (
        <View style={[styles.ringClip, { left: half, width: half, height: size }]}>
          <View style={[styles.ringBorder, shape, arc, { left: -half, transform: [{ rotate: `${Math.min(angle, 180) - 135}deg` }] }]} />
        </View>
      )}
      {angle > 180 && (
        <View style={[styles.ringClip, { left: 0, width: half, height: size }]}>
          <View style={[styles.ringBorder, shape, arc, { transform: [{ rotate: `${angle - 135}deg` }] }]} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { width: '100%', maxWidth: 690, alignSelf: 'center', minHeight: 60, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  homeHeader: { minHeight: 70, paddingHorizontal: 17 },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  headerTitle: { fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.35 },
  centered: { fontSize: 17, textAlign: 'center' },
  largeTitle: { fontSize: 22, lineHeight: 26 },
  subtitle: { textAlign: 'center' },
  headerSpacer: { width: 42 },
  hint: { fontSize: 12, fontWeight: '500' },
  body: { width: '100%', maxWidth: 690, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 4, paddingBottom: 26, gap: 12 },
  footer: { width: '100%', maxWidth: 690, alignSelf: 'center', paddingHorizontal: 14, paddingBottom: 6, paddingTop: 5 },
  panel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 19, padding: 12, gap: 8 },
  iconButton: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  paragraph: { fontSize: 13, lineHeight: 19 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  pill: { flexGrow: 1, minHeight: 35, paddingHorizontal: 7, paddingVertical: 5, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pillText: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
  action: { minHeight: 45, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 23 },
  actionLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  track: { height: 7, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  ring: { justifyContent: 'center', alignItems: 'center' },
  ringBorder: { position: 'absolute', top: 0, left: 0 },
  ringClip: { position: 'absolute', top: 0, overflow: 'hidden' },
});
