import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const learningAreas = [
  { title: 'Courses', description: 'Continue your Japanese lessons.' },
  { title: 'Practice', description: 'Train reading, listening, and speaking.' },
  { title: 'Vocabulary', description: 'Review words and build your library.' },
  { title: 'Kanji', description: 'Follow your kanji learning roadmap.' },
] as const;

export function HomeDashboard() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ThemedView style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary">
          MIRAI GO
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Keep learning.
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Build a consistent Japanese learning habit, one focused session at a time.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <ThemedText type="subtitle">Today&apos;s progress</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              0 / 30 min
            </ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressValue} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Start a short practice session to keep your streak moving.
          </ThemedText>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Learn with MiraiGo
        </ThemedText>
        <View style={styles.grid}>
          {learningAreas.map((area) => (
            <Pressable key={area.title} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.cardContent}>
                <ThemedText type="smallBold">{area.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {area.description}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four, gap: Spacing.two },
  title: { marginTop: Spacing.one },
  progressCard: { marginTop: Spacing.four, padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.three },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#C7CBD1', overflow: 'hidden' },
  progressValue: { width: '8%', height: '100%', backgroundColor: '#208AEF', borderRadius: 4 },
  sectionTitle: { marginTop: Spacing.four },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: { flexGrow: 1, flexBasis: '46%', minWidth: 140 },
  cardContent: { minHeight: 112, padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  pressed: { opacity: 0.7 },
});
