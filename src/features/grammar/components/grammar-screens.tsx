import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, LearnerSectionHeading, LearnerTile, useLearnerPalette } from '@/components/ui/learner-glass';
import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';
import type { GrammarLevel } from '@/features/grammar/types/catalog';
import { useTheme } from '@/hooks/use-theme';

export function GrammarCatalogScreen() {
  const router = useRouter();
  return (
    <LearnerCanvas>
      <LearnerHeading title="Ngữ pháp" description="Khám phá cấu trúc và ví dụ tiếng Nhật từ N5 đến N1." />
      <LearnerPanel>
        <ThemedText type="smallBold">{grammarLevels.length} cấp độ · {grammarPoints.length} mẫu ngữ pháp</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Nội dung có sẵn khi offline.</ThemedText>
      </LearnerPanel>
      <LearnerSectionHeading title="Cấp độ ngữ pháp" />
      <View style={styles.grid}>
        {grammarLevels.map((level) => (
          <LearnerTile
            key={level.id}
            glyph={level.level}
            tone="indigo"
            title={level.title}
            description={`${level.source} · ${level.grammarCount} mẫu`}
            onPress={() => router.push({ pathname: '/grammar/[levelId]', params: { levelId: level.id } })}
          />
        ))}
      </View>
    </LearnerCanvas>
  );
}

export function GrammarLevelScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const level = grammarLevels.find((item) => item.id === levelId);
  return (
    <LearnerCanvas>
      <LearnerBack href="/grammar" label="Các cấp độ ngữ pháp" />
      {level
        ? <GrammarLevelContent key={level.id} level={level} />
        : <LearnerPanel><ThemedText>Không tìm thấy cấp độ này.</ThemedText></LearnerPanel>}
    </LearnerCanvas>
  );
}

function GrammarLevelContent({ level }: { level: GrammarLevel }) {
  const [search, setSearch] = useState('');
  const [openPoint, setOpenPoint] = useState<string | null>(null);
  const palette = useLearnerPalette();
  const theme = useTheme();
  const key = search.trim().toLowerCase();
  const points = grammarPoints.filter((point) =>
    point.levelId === level.id && [point.title, point.meaning, point.structure, `bài ${point.lesson}`, ...(point.tags ?? [])]
      .some((value) => value.toLowerCase().includes(key)));

  return (
    <>
      <LearnerHeading title={level.title} description={level.source} />
      <TextInput
        accessibilityLabel="Tìm mẫu ngữ pháp"
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo từ khóa hoặc số bài"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        style={[styles.search, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }]}
      />
      <LearnerSectionHeading title="Danh sách ngữ pháp" detail={<ThemedText type="small" themeColor="textSecondary">{points.length} mẫu</ThemedText>} />
      {points.length === 0 && <LearnerPanel><ThemedText>Không có mẫu phù hợp.</ThemedText></LearnerPanel>}
      {points.map((point) => {
        const expanded = openPoint === point.id;
        return (
          <LearnerPanel key={point.id}>
            <LearnerControl label={point.title} glyph={expanded ? '−' : '+'} accessibilityState={{ expanded }} onPress={() => setOpenPoint(expanded ? null : point.id)} style={styles.action} />
            <ThemedText type="small" themeColor="textSecondary">Bài {point.lesson} · {point.meaning}</ThemedText>
            {expanded && (
              <View style={styles.detail}>
                <ThemedText type="smallBold">Cấu trúc</ThemedText>
                <ThemedText selectable>{point.structure}</ThemedText>
                {point.notes && <ThemedText type="small" themeColor="textSecondary">{point.notes}</ThemedText>}
                {Boolean(point.tags?.length) && <ThemedText type="small" themeColor="textSecondary">{point.tags?.join(' · ')}</ThemedText>}
                {point.examples.length > 0 && <ThemedText type="smallBold">Ví dụ</ThemedText>}
                {point.examples.map((example, index) => (
                  <View key={index} style={[styles.example, { borderColor: palette.border }]}>
                    <ThemedText selectable>{example.japanese}</ThemedText>
                    {example.reading && <ThemedText type="small">{example.reading}</ThemedText>}
                    <ThemedText type="small" themeColor="textSecondary">{example.vietnamese}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </LearnerPanel>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  detail: { gap: 8 },
  example: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 4 },
  action: { alignSelf: 'flex-start', maxWidth: '100%' },
});
