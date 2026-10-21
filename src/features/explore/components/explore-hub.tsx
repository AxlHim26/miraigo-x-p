import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { exploreItems } from '@/features/explore/data/explore-items';
import type { ExploreCategory } from '@/features/explore/types/explore';
import { useTheme } from '@/hooks/use-theme';

const filters: { key: ExploreCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'learn', label: 'Learn' },
  { key: 'practice', label: 'Practice' },
  { key: 'review', label: 'Review' },
];

export function ExploreHub() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<ExploreCategory>('all');

  const visibleItems = useMemo(
    () => activeFilter === 'all' ? exploreItems : exploreItems.filter((item) => item.category === activeFilter),
    [activeFilter],
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ThemedView style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary">DISCOVER YOUR PATH</ThemedText>
        <ThemedText type="subtitle" style={styles.title}>Explore learning</ThemedText>
        <ThemedText themeColor="textSecondary">
          Choose a focused path and make your next study session count.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.featuredCard}>
          <View style={styles.featuredCopy}>
            <ThemedText type="small" themeColor="textSecondary">RECOMMENDED FOR YOU</ThemedText>
            <ThemedText type="subtitle">Keep your streak alive</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              A 10-minute vocabulary review is ready to go.
            </ThemedText>
          </View>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.primaryButtonText}>Start review</ThemedText>
          </Pressable>
        </ThemedView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                style={({ pressed }) => [
                  styles.filter,
                  { backgroundColor: isActive ? theme.text : theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: isActive ? theme.background : theme.textSecondary }}>
                  {filter.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {visibleItems.map((item) => (
            <Pressable key={item.id} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.itemContent}>
                <View style={[styles.accent, { backgroundColor: item.accent }]} />
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.description}</ThemedText>
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
  featuredCard: { marginTop: Spacing.four, padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.three },
  featuredCopy: { gap: Spacing.one },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: '#208AEF', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.five },
  primaryButtonText: { color: '#FFFFFF' },
  filters: { gap: Spacing.two, paddingVertical: Spacing.three },
  filter: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.five },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  item: { flexGrow: 1, flexBasis: '46%', minWidth: 140 },
  itemContent: { minHeight: 144, padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  accent: { width: 32, height: 6, borderRadius: 3, marginBottom: Spacing.one },
  pressed: { opacity: 0.7 },
});
