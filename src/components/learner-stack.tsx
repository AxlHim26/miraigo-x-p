import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function LearnerStack() {
  const theme = useTheme();

  return <Stack screenOptions={{
    headerShown: false,
    animation: 'fade_from_bottom',
    animationDuration: 260,
    contentStyle: { backgroundColor: theme.background },
  }} />;
}
