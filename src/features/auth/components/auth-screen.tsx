import { router } from 'expo-router';
import { useState, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand-logo';

const palette = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  ink: '#172033',
  muted: '#69758A',
  line: '#DCE3EF',
  blue: '#4F83FF',
  blueDark: '#3D73F3',
  error: '#B42318',
  errorBg: '#FEF3F2',
  success: '#067647',
  successBg: '#ECFDF3',
};

export function AuthScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View pointerEvents="none" style={styles.artTop} />
          <View pointerEvents="none" style={styles.artBottom} />
          <View style={styles.card}>{children}</View>
          <Text style={styles.footer}>Học tiếng Nhật mỗi ngày cùng MiraiGo</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthBrand() {
  return <View style={{ marginBottom: 24 }}><BrandLogo /></View>;
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function AuthField({
  label,
  secureTextEntry,
  ...props
}: TextInputProps & { label: string }) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const isPassword = Boolean(secureTextEntry);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && hidden}
          placeholderTextColor="#9AA5B5"
          style={styles.input}
        />
        {isPassword ? (
          <Pressable accessibilityRole="button" onPress={() => setHidden((value) => !value)} hitSlop={10}>
            <Text style={styles.showPassword}>{hidden ? 'Hiện' : 'Ẩn'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AuthButton({
  title,
  pending,
  disabled,
  onPress,
}: {
  title: string;
  pending?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || pending}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled || pending) && styles.buttonMuted]}>
      {pending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

export function AuthMessage({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  return (
    <View style={[styles.message, tone === 'error' ? styles.errorBox : styles.successBox]}>
      <Text style={[styles.messageText, tone === 'error' ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </View>
  );
}

export function AuthLink({
  prompt,
  label,
  href,
}: {
  prompt: string;
  label: string;
  href: '/login' | '/register';
}) {
  return (
    <View style={styles.linkRow}>
      <Text style={styles.linkPrompt}>{prompt} </Text>
      <Pressable onPress={() => router.replace(href)} accessibilityRole="link">
        <Text style={styles.linkLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

export const authPalette = palette;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 28 },
  artTop: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#E5EDFF', top: -130, right: -95,
  },
  artBottom: {
    position: 'absolute', width: 210, height: 210, borderRadius: 105,
    backgroundColor: '#EAF1FF', bottom: -95, left: -105,
  },
  card: {
    width: '100%', maxWidth: 500, alignSelf: 'center', backgroundColor: palette.surface,
    borderRadius: 26, paddingHorizontal: 24, paddingVertical: 28,
    borderWidth: 1, borderColor: '#E8ECF3',
    shadowColor: '#192B52', shadowOpacity: 0.08, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 3,
  },
  brandRow: { marginBottom: 28 },
  heading: { gap: 7, marginBottom: 24 },
  title: { color: palette.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  fieldWrap: { gap: 8, marginBottom: 16 },
  label: { color: '#344054', fontSize: 13, fontWeight: '700' },
  inputRow: {
    height: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    borderWidth: 1, borderColor: palette.line, paddingHorizontal: 15, backgroundColor: '#FFFFFF',
  },
  input: { flex: 1, height: '100%', color: palette.ink, fontSize: 15, paddingVertical: 0 },
  showPassword: { color: palette.blueDark, fontSize: 13, fontWeight: '700', paddingLeft: 10 },
  button: {
    minHeight: 54, borderRadius: 15, backgroundColor: palette.blue,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: palette.blue, shadowOpacity: 0.24, shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 }, elevation: 3,
  },
  buttonMuted: { opacity: 0.68 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  message: { borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 16 },
  errorBox: { backgroundColor: palette.errorBg },
  successBox: { backgroundColor: palette.successBg },
  messageText: { fontSize: 13, lineHeight: 19 },
  errorText: { color: palette.error },
  successText: { color: palette.success },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 23, flexWrap: 'wrap' },
  linkPrompt: { color: palette.muted, fontSize: 13 },
  linkLabel: { color: palette.blueDark, fontSize: 13, fontWeight: '800' },
  footer: { alignSelf: 'center', color: '#8994A5', fontSize: 12, marginTop: 20 },
});
