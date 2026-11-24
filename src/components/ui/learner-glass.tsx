import { useId, type ComponentRef, type PropsWithChildren, type ReactNode, type Ref } from 'react';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, Pressable, ScrollView, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { studyColors } from '@/constants/study-colors';
import { Colors, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Match the learner palette in miraigo-fe/src/app/globals.css.
const learnerAccent = '#6366F1';

const featureColors = {
  blue: { light: '#1D4ED8', dark: '#93C5FD', fill: '#DBEAFE' },
  indigo: { light: '#5B21B6', dark: '#D8B4FE', fill: '#EDE9FE' },
  emerald: { light: '#047857', dark: '#6EE7B7', fill: '#D1FAE5' },
  amber: { light: '#92400E', dark: '#FCD34D', fill: '#FEF3C7' },
};

type FeatureTone = keyof typeof featureColors;

export function useLearnerPalette() {
  const theme = useTheme();
  const dark = theme === Colors.dark;
  return {
    dark,
    background: theme.background,
    surface: theme.backgroundElement,
    border: dark ? '#FFFFFF17' : '#D6DFEB',
    hero: dark ? '#262626' : '#F2F6FC',
    accentText: dark ? '#BFDBFE' : '#1D4ED8',
    accentTitle: dark ? '#C4B5FD' : '#4F46E5',
    selection: theme.backgroundSelected,
    danger: dark ? '#FFACA6' : '#A82A24',
    text: theme.text,
  };
}

type LayerProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

export function LearnerCanvas({ children, scrollRef, ambient = false }: PropsWithChildren<{ scrollRef?: Ref<ComponentRef<typeof ScrollView>>; ambient?: boolean }>) {
  const insets = useSafeAreaInsets();
  const palette = useLearnerPalette();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      ref={scrollRef}
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[styles.canvas, { paddingBottom: Platform.OS === 'ios' ? 24 : insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {ambient && <LightWash accent={learnerAccent} canvas />}
        {children}
      </View>
    </ScrollView>
  );
}

export function LearnerHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  const palette = useLearnerPalette();
  return (
    <View style={styles.heading}>
      {eyebrow && <ThemedText type="smallBold" style={[styles.eyebrow, { color: palette.accentText }]}>{eyebrow}</ThemedText>}
      <ThemedText accessibilityRole="header" style={styles.title}>{title}</ThemedText>
      {description && <ThemedText themeColor="textSecondary" style={styles.description}>{description}</ThemedText>}
    </View>
  );
}

export function LearnerSectionHeading({ title, detail }: { title: string; detail?: ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>{title}</ThemedText>
      {detail}
    </View>
  );
}

export function LearnerPanel({ children, style }: LayerProps) {
  const palette = useLearnerPalette();
  return <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>{children}</View>;
}

export function LearnerGlyph({ glyph, tone = 'blue' }: { glyph: string; tone?: FeatureTone }) {
  const { dark } = useLearnerPalette();
  const colors = featureColors[tone];
  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.featureGlyph, { backgroundColor: dark ? `${colors.dark}26` : colors.fill }]}>
      <ThemedText style={[styles.featureGlyphText, { color: dark ? colors.dark : colors.light }]}>{glyph}</ThemedText>
    </View>
  );
}

export function LearnerTile({ title, description, glyph, tone, onPress, style }: {
  title: string;
  description: string;
  glyph: string;
  tone?: FeatureTone;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, style, pressed && styles.tilePressed]}>
      <LearnerPanel style={styles.tilePanel}>
        <LearnerGlyph glyph={glyph} tone={tone} />
        <ThemedText type="smallBold" style={styles.tileTitle}>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
      </LearnerPanel>
    </Pressable>
  );
}

export function LearnerHero({ accent = learnerAccent, glyph, children, style, darkBanner = false }: LayerProps & { accent?: string; glyph?: string; darkBanner?: boolean }) {
  const palette = useLearnerPalette();
  return (
    <View style={[styles.hero, { backgroundColor: darkBanner ? '#0F172A' : palette.hero, borderColor: darkBanner ? '#334155' : palette.border }, style]}>
      <LightWash accent={accent} />
      {glyph && <ThemedText accessible={false} accessibilityElementsHidden importantForAccessibility="no" style={[styles.heroGlyph, { color: darkBanner ? '#93C5FD' : palette.accentText }]}>{glyph}</ThemedText>}
      {children}
    </View>
  );
}

function LightWash({ accent, canvas = false }: { accent: string; canvas?: boolean }) {
  const gradientId = `learner-light-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <View pointerEvents="none" style={canvas ? styles.canvasWash : StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 360 280" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={gradientId} cx="82%" cy="18%" rx="66%" ry="78%">
            <Stop offset="0" stopColor={accent} stopOpacity={canvas ? 0.14 : 0.42} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="360" height="280" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const nativeGlassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();

type LearnerControlProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  glyph?: string;
  selected?: boolean;
  tone?: 'neutral' | 'accent' | 'danger' | 'primary' | 'onDark';
  style?: StyleProp<ViewStyle>;
};

export function LearnerControl({ label, glyph, selected, tone = 'neutral', style, disabled, accessibilityState, ...props }: LearnerControlProps) {
  const palette = useLearnerPalette();
  const emphasized = selected || tone === 'accent';
  const prominent = tone === 'primary' || tone === 'onDark';
  const fill = tone === 'onDark' ? '#1E40AF' : palette.dark ? '#E2E8F0' : '#0F172A';
  const color = prominent ? (tone === 'onDark' || !palette.dark ? '#F8FAFC' : '#0F172A')
    : tone === 'danger' ? palette.danger : emphasized ? palette.accentText : palette.text;
  const glyphColor = Platform.OS === 'web' || prominent || tone === 'danger' ? color : studyColors[palette.dark ? 'dark' : 'light'].icon;
  const Body = nativeGlassAvailable ? GlassView : View;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      disabled={disabled}
      accessibilityState={{ ...accessibilityState, disabled, selected }}
      style={style}>
      {({ pressed }) => (
        <Body
          {...(nativeGlassAvailable ? { glassEffectStyle: 'regular' as const, isInteractive: !disabled, tintColor: prominent ? fill : emphasized ? palette.selection : undefined } : {})}
          style={[
            styles.control,
            !nativeGlassAvailable && {
              backgroundColor: prominent ? fill : emphasized || (pressed && !disabled) ? palette.selection : palette.surface,
              borderColor: prominent ? fill : palette.border,
              borderWidth: StyleSheet.hairlineWidth,
            },
            !nativeGlassAvailable && prominent && pressed && !disabled && styles.tilePressed,
          ]}>
          {glyph && <ThemedText style={[styles.controlGlyph, { color: glyphColor }]}>{glyph}</ThemedText>}
          <ThemedText type="smallBold" style={[styles.controlLabel, { color }]}>{label}</ThemedText>
        </Body>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  canvas: { flexGrow: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: 20, paddingTop: 24, gap: 18 },
  canvasWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  heading: { gap: 6 },
  eyebrow: { letterSpacing: 1.25, fontSize: 11 },
  title: { fontSize: 32, lineHeight: 37, letterSpacing: -0.8, fontWeight: '800' },
  description: { fontSize: 15, lineHeight: 22 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  sectionTitle: { flexShrink: 1, fontSize: 20, lineHeight: 26, letterSpacing: -0.35, fontWeight: '800' },
  panel: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  featureGlyph: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureGlyphText: { fontSize: 20, lineHeight: 26, fontWeight: '800' },
  tile: { flexBasis: 140, flexGrow: 1 },
  tilePanel: { flex: 1, minHeight: 136, gap: 9 },
  tileTitle: { fontSize: 16, lineHeight: 21 },
  tilePressed: { opacity: 0.76 },
  hero: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 20, overflow: 'hidden', gap: 12 },
  heroGlyph: { position: 'absolute', right: 18, top: 26, fontSize: 76, lineHeight: 98, fontWeight: '800', opacity: 0.16 },
  control: { minHeight: 44, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  controlLabel: { flexShrink: 1, textAlign: 'center' },
  controlGlyph: { fontSize: 17, fontWeight: '700' },
});
