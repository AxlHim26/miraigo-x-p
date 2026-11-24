import { useEffect, type PropsWithChildren } from 'react';
import { usePathname } from 'expo-router';
import { Appearance, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { env } from '@/core/config/env';
import { BrandLogo } from '@/components/brand-logo';
import { LearnerBottomNavigation } from '@/components/learner-bottom-navigation';
import { useLearnerPalette } from '@/components/ui/learner-glass';
import { shouldHideLearnerTabs } from '@/constants/learner-navigation';
import { studyColors } from '@/constants/study-colors';
import { useLearnerProfile } from '@/features/auth/profile/use-learner-profile';
import { useStudyTimeTracking } from '@/features/home/hooks/use-study-time';

export function LearnerAppShell({ children }: PropsWithChildren) {
  const palette = useLearnerPalette();
  const pathname = usePathname();
  const { data: { theme } } = useLearnerProfile();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Appearance.setColorScheme(theme === 'Sáng' ? 'light' : theme === 'Tối' ? 'dark' : 'unspecified');
    return () => Appearance.setColorScheme('unspecified');
  }, [theme]);
  useStudyTimeTracking(pathname);
  const immersive = shouldHideLearnerTabs(pathname);
  const hasScreenHeader = pathname === '/' || pathname === '/progress'
    || /^\/(?:vocabulary|grammar|courses|account|settings)(?:\/|$)/.test(pathname)
    || /^\/practice(?:$|\/(?:listening|reading|speaking|chat|ai-dialogue|catalog|drill|plan|review|saved|reading-quiz)(?:\/|$))/.test(pathname);
  const colors = studyColors[palette.dark ? 'dark' : 'light'];

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <SafeAreaView
        edges={['top']}
        style={hasScreenHeader ? { backgroundColor: colors.sky } : [styles.safeHeader, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        {env.demoMode && <Text accessibilityRole="text" style={[styles.demo, { color: colors.blue, backgroundColor: colors.iconFill }]}>Bản demo · Dữ liệu mẫu</Text>}
        {!hasScreenHeader && (
          <View style={styles.header}>
            <BrandLogo compact wordmarkColor={palette.text} />
          </View>
        )}
      </SafeAreaView>

      <SafeAreaView edges={immersive ? ['bottom'] : []} collapsable={false}
        style={[styles.body, immersive && { backgroundColor: colors.background }]}>
        {children}
      </SafeAreaView>

      {Platform.OS !== 'ios' && !immersive && <LearnerBottomNavigation />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeHeader: { borderBottomWidth: StyleSheet.hairlineWidth },
  header: { height: 56, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  demo: { textAlign: 'center', fontSize: 11, fontWeight: '700', paddingVertical: 4 },
});
