import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, LearnerSectionHeading, LearnerTile, useLearnerPalette } from '@/components/ui/learner-glass';
import { allKanji, findKanji, kanjiCatalog, kanjiLevels, type KanjiLevel } from '@/features/kanji/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { normalizeStudySearch } from '@/shared/utils/study-search';

const pageSize = 32;
const levelHref = (level: KanjiLevel) => ({ pathname: '/kanji/[level]' as const, params: { level } });
const characterHref = (glyph: string, fromLevel?: KanjiLevel) => ({
  pathname: '/kanji/character/[glyph]' as const,
  params: fromLevel ? { glyph, fromLevel } : { glyph },
});

export function KanjiCatalogScreen() {
  const router = useRouter();
  return (
    <LearnerCanvas>
      <LearnerHeading title="Hán tự" description="Tra cứu và học Hán tự theo cấp độ JLPT, kể cả khi offline." />
      <LearnerControl label="Tra cứu Hán tự" tone="accent" onPress={() => router.push('/kanji/lookup')} style={styles.action} />
      <LearnerControl label="Ôn Hán tự" onPress={() => router.push('/kanji/review')} style={styles.action} />
      <LearnerControl label="Kanji Map" glyph="›" onPress={() => router.push('/kanji/map')} />
      <LearnerControl label="Tra chữ viết tay" glyph="›" onPress={() => router.push('/kanji/handwriting')} />
      <LearnerSectionHeading title="Lộ trình Hán tự" />
      <View style={styles.grid}>
        {kanjiLevels.map((level) => (
          <LearnerTile key={level} glyph={level} tone="amber" title={`Hán tự ${level}`} description={`${kanjiCatalog[level].length} chữ`} onPress={() => router.push(levelHref(level))} />
        ))}
      </View>
    </LearnerCanvas>
  );
}

export function KanjiLevelScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const selected = typeof level === 'string' ? kanjiLevels.find((value) => value === level.toUpperCase()) : undefined;
  return (
    <LearnerCanvas>
      <LearnerBack href="/kanji" label="Hán tự" />
      {selected ? (
        <>
          <LearnerHeading title={`Hán tự ${selected}`} description="Sắp theo số nét, từ đơn giản đến phức tạp." />
          <KanjiResults key={selected} level={selected} />
        </>
      ) : <LearnerPanel><ThemedText>Không tìm thấy cấp độ này.</ThemedText></LearnerPanel>}
    </LearnerCanvas>
  );
}

export function KanjiLookupScreen() {
  return (
    <LearnerCanvas>
      <LearnerBack href="/kanji" label="Hán tự" />
      <LearnerHeading title="Tra cứu Hán tự" description="Tìm theo mặt chữ, âm đọc, âm Hán Việt hoặc nghĩa." />
      <KanjiResults />
    </LearnerCanvas>
  );
}

function KanjiResults({ level }: { level?: KanjiLevel }) {
  const router = useRouter();
  const palette = useLearnerPalette();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(pageSize);
  const key = normalizeStudySearch(search);
  const matches = allKanji.filter((item) => (!level || level === item.level)
    && (!key || item.row.some((field) => typeof field === 'string' && normalizeStudySearch(field).includes(key))));
  return (
    <>
      <TextInput
        accessibilityLabel="Tìm Hán tự"
        value={search}
        onChangeText={(value) => { setSearch(value); setLimit(pageSize); }}
        placeholder="Ví dụ: 学, ガク, học"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        style={[styles.search, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }]}
      />
      <LearnerSectionHeading title="Kết quả" detail={<ThemedText type="small" themeColor="textSecondary">{matches.length} chữ</ThemedText>} />
      {matches.length === 0 && <LearnerPanel><ThemedText>Không tìm thấy chữ phù hợp.</ThemedText></LearnerPanel>}
      <View style={styles.grid}>
        {matches.slice(0, limit).map(({ row, level: resultLevel }) => (
          <LearnerTile
            key={`${resultLevel}-${row[0]}`}
            glyph={row[0]}
            tone="amber"
            title={`${row[0]} · ${resultLevel}`}
            description={row[1] || `${row[4]} nét`}
            onPress={() => router.push(characterHref(row[0], level))}
          />
        ))}
      </View>
      {limit < matches.length && <LearnerControl label="Xem thêm" onPress={() => setLimit((value) => value + pageSize)} style={styles.action} />}
    </>
  );
}

export function KanjiCharacterScreen() {
  const router = useRouter();
  const { glyph, fromLevel } = useLocalSearchParams<{ glyph: string; fromLevel?: string }>();
  const item = typeof glyph === 'string' ? findKanji(glyph) : undefined;
  const backLevel = kanjiLevels.find((level) => level === fromLevel);
  return (
    <LearnerCanvas>
      <LearnerBack href={backLevel ? levelHref(backLevel) : '/kanji/lookup'} label={backLevel ? `Hán tự ${backLevel}` : 'Tra cứu Hán tự'} />
      {item ? (
        <LearnerPanel>
          <LearnerHeading eyebrow={item.level} title={item.row[0]} description={item.row[1] || undefined} />
          {item.row[6] && <ThemedText>Hán Việt: {item.row[6]}</ThemedText>}
          {item.row[2] && <ThemedText selectable>Âm On: {item.row[2]}</ThemedText>}
          {item.row[3] && <ThemedText selectable>Âm Kun: {item.row[3]}</ThemedText>}
          {item.row[5] && <ThemedText>Bộ thủ: {item.row[5]}</ThemedText>}
          {item.row[4] > 0 && <ThemedText>Số nét: {item.row[4]}</ThemedText>}
          <LearnerControl label="Bản đồ và thứ tự nét" onPress={() => router.push({
            pathname: '/kanji/map', params: { glyph: item.row[0] },
          })} />

        </LearnerPanel>
      ) : <LearnerPanel><ThemedText>Không tìm thấy chữ này.</ThemedText></LearnerPanel>}
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  action: { alignSelf: 'flex-start' },
});
