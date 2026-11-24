import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppProviders } from '@/core/providers/app-providers';
import { env } from '@/core/config/env';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: env.demoMode || env.autoLogin ? '(learner)' : 'login',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppProviders>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 260 }}>
            <Stack.Screen name="(learner)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="verify-email" />
          </Stack>
        </AppProviders>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
