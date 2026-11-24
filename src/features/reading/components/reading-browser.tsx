import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { ArticleRow, readingIcons } from '@/features/reading/components/reading-ui';
import { readingLibrary } from '@/features/reading/data/reading-library';
import { readingStatus, readingWeek } from '@/features/reading/data/reading-progress';
import { preferredReadingLevels, type ReadingArticle } from '@/features/reading/data/reading-schema';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';
import { normalizeStudySearch } from '@/shared/utils/study-search';

const root = '/practice/reading';
const filters = ['Tất cả', 'Chưa học', 'Đang học', 'Đã xong'] as const;
const shortcuts = [
  { title: 'Đọc mới', icon: readingIcons.book, mode: 'library' },
  { title: 'Tạo bằng AI', icon: readingIcons.sparkles, mode: 'create' },
  { title: 'Ôn tập', icon: readingIcons.target, mode: 'review' },
  { title: 'Lưu lại', icon: readingIcons.saved, mode: 'saved' },
] as const;

export const readingArticleHref = (articleId: string): Href => ({ pathname: '/practice/reading/[articleId]', params: { articleId } });

export function ReadingHome() {
  const router = useRouter();
  const user = useCurrentUser().data;
  return (
    <StudyScreen title="Luyện đọc" largeTitle hint={user?.username ? `こんにちは、${user.username}` : 'こんにちは'}
      action={<StudyIconButton icon={readingIcons.chart} label="Thống kê luyện đọc" onPress={() => router.push('/practice/reading/stats')} />}>
      <HomeContent />
    </StudyScreen>
  );
}

function HomeContent() {
  const router = useRouter();
  const colors = useStudyColors();
  const study = useReadingProgress();
  const { entries } = study.progress;
  const collection = [...readingLibrary, ...study.progress.articles];
  const recent = collection.filter((article) => entries[article.id]?.opened)
    .sort((a, b) => entries[b.id].opened - entries[a.id].opened)[0];
  const level = recent?.level ?? 'N5';
  const atLevel = collection.filter((article) => article.level === level);
  const completed = atLevel.filter((article) => entries[article.id]?.result).length;
  const fraction = atLevel.length ? completed / atLevel.length : 0;
  const featured = recent ?? readingLibrary[0];

  function open(mode: typeof shortcuts[number]['mode']) {
    if (mode === 'create') router.push('/practice/reading/create');
    else router.push({ pathname: '/practice/reading/library', params: { level, mode } });
  }

  return (
    <>
      <Pressable accessibilityRole="link" accessibilityLabel={`Bài đọc ${level}, hoàn thành ${Math.round(fraction * 100)} phần trăm`}
        onPress={() => open('library')}
        style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.7 : 1 }]}>
        <View pointerEvents="none" style={styles.bannerGlow} />
        <View style={styles.bannerCopy}>
          <Text style={styles.level}>{level}</Text>
          <Text style={styles.bannerLabel}>Tiến độ luyện đọc</Text>
          <StudyProgressBar fraction={fraction} tone="onBlue" style={styles.bannerTrack} />
          <Text style={styles.bannerCaption}>{completed}/{atLevel.length} bài đã hoàn thành</Text>
        </View>
        <StudyRing progress={fraction} size={77} tone="onBlue">
          <Text style={styles.bannerPercent}>{Math.round(fraction * 100)}%</Text>
        </StudyRing>
      </Pressable>

      <View style={styles.shortcuts}>
        {shortcuts.map(({ title, icon, mode }) => (
          <Pressable accessibilityRole="link" key={mode} onPress={() => open(mode)}
            style={({ pressed }) => [styles.shortcut, {
              backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 9px ${colors.shadow}`, opacity: pressed ? 0.7 : 1,
            }]}>
            <StudyIcon name={icon} color={colors.icon} size={23} />
            <Text style={[styles.shortcutLabel, { color: colors.text }]}>{title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.group}>
        <View style={styles.heading}>
          <StudyText heading>{recent ? 'Bài đọc gần đây' : 'Bài đọc đề xuất'}</StudyText>
          <Pressable accessibilityRole="link" accessibilityLabel="Xem thư viện bài đọc" onPress={() => open('library')} hitSlop={9}>
            <StudyIcon name={readingIcons.next} color={colors.icon} size={16} />
          </Pressable>
        </View>
        <ArticleRow article={featured} status={readingStatus(entries[featured.id])} answered={Object.keys(entries[featured.id]?.draft ?? {}).length}
          onPress={() => router.push(readingArticleHref(featured.id))} />
      </View>
      <WeekOverview progress={study.progress} />
      {study.readError && <StudyActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
    </>
  );
}

function WeekOverview({ progress }: { progress: ReturnType<typeof useReadingProgress>['progress'] }) {
  const router = useRouter();
  const colors = useStudyColors();
  const [previous, setPrevious] = useState(false);
  const days = readingWeek(progress, previous);
  const max = Math.max(1, ...days.map(({ values }) => values[0]));

  return (
    <StudyPanel>
      <View style={styles.heading}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/practice/reading/stats')}>
          <StudyText heading>Thống kê luyện đọc</StudyText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityHint="Đổi tuần hiển thị" onPress={() => setPrevious((value) => !value)}
          style={[styles.weekToggle, { backgroundColor: colors.iconFill }]}>
          <Text style={[styles.small, { color: colors.blue }]}>{previous ? 'Tuần trước' : 'Tuần này'}</Text>
          <StudyIcon name={readingIcons.down} color={colors.icon} size={12} />
        </Pressable>
      </View>
      <View style={styles.bars}>
        {days.map(({ date, values }, index) => {
          const label = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index];
          return (
            <View key={date.toISOString()} accessible accessibilityLabel={`${label}, ${values[0]} bài hoàn thành`} style={styles.barDay}>
              <View style={[styles.bar, { height: values[0] ? Math.max(5, values[0] / max * 48) : 3, backgroundColor: values[0] ? colors.icon : colors.track }]} />
              <Text style={[styles.small, { color: colors.secondary }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </StudyPanel>
  );
}

export function ReadingBrowser() {
  const params = useLocalSearchParams<{ level?: string; mode?: string }>();
  const [level, setLevel] = useState<typeof preferredReadingLevels[number]>(preferredReadingLevels.find((item) => item === params.level) ?? 'N5');
  const [searching, setSearching] = useState(false);
  const title = params.mode === 'saved' ? 'Bài đọc đã lưu' : params.mode === 'review' ? 'Ôn tập luyện đọc' : `${level} · Luyện đọc`;
  return (
    <StudyScreen title={title} largeTitle back={root}
      action={<StudyIconButton icon={readingIcons.search} label={searching ? 'Đóng tìm kiếm' : 'Tìm bài đọc'}
        selected={searching} onPress={() => setSearching((open) => !open)} />}>
      <BrowserContent searching={searching} level={level} setLevel={setLevel} mode={params.mode} />
    </StudyScreen>
  );
}

function BrowserContent({ searching, level, setLevel, mode }: {
  searching: boolean;
  level: typeof preferredReadingLevels[number];
  setLevel: (level: typeof preferredReadingLevels[number]) => void;
  mode: string | undefined;
}) {
  const router = useRouter();
  const colors = useStudyColors();
  const study = useReadingProgress();
  const { entries } = study.progress;
  const [filter, setFilter] = useState<typeof filters[number]>('Tất cả');
  const [search, setSearch] = useState('');
  const libraryMode = mode !== 'saved' && mode !== 'review';
  const query = searching ? normalizeStudySearch(search) : '';
  const visible = [...readingLibrary, ...study.progress.articles].filter((item: ReadingArticle) => {
    const entry = entries[item.id];
    if (mode === 'saved' && !entry?.saved) return false;
    if (mode === 'review' && !entry?.result) return false;
    if (libraryMode && (item.level !== level || (filter !== 'Tất cả' && readingStatus(entry) !== filter))) return false;
    return !query || normalizeStudySearch(`${item.title} ${item.topic} ${item.level}`).includes(query);
  });

  return (
    <>
      {libraryMode && <StudyPills options={preferredReadingLevels} current={level} onSelect={setLevel} />}
      {searching && <TextInput accessibilityLabel="Tìm theo tên hoặc chủ đề" value={search} onChangeText={setSearch} autoFocus autoCapitalize="none"
        placeholder="Tìm theo tên bài hoặc chủ đề" placeholderTextColor={colors.secondary}
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.title }]} />}
      {libraryMode && <StudyPills options={filters} current={filter} onSelect={setFilter} />}
      {study.readError && <StudyActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
      {visible.length === 0 && <StudyPanel>
        <StudyText>{!study.ready && !study.readError ? 'Đang tải tiến độ…' : query ? 'Không tìm thấy bài phù hợp.'
          : mode === 'saved' ? 'Chưa có bài đọc nào được lưu.' : mode === 'review' ? 'Hoàn thành một bài đọc để bắt đầu ôn lại.' : 'Chưa có bài ở bộ lọc này.'}</StudyText>
      </StudyPanel>}
      <View style={styles.rows}>
        {visible.map((article) => {
          const entry = entries[article.id];
          return <ArticleRow key={article.id} article={article} status={readingStatus(entry)} answered={Object.keys(entry?.draft ?? {}).length}
            onPress={() => router.push(readingArticleHref(article.id))} />;
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  banner: { overflow: 'hidden', borderRadius: 20, padding: 14, minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: '#21649D', backgroundImage: 'linear-gradient(140deg,#5099CB,#277DB9 58%,#154A7D)' },
  bannerGlow: { ...StyleSheet.absoluteFill, backgroundImage: 'radial-gradient(ellipse at top left, rgba(246,254,255,0.34),transparent 65%)' },
  bannerCopy: { flex: 1, gap: 3 },
  level: { color: '#FFFFFF', fontSize: 33, fontWeight: '800' },
  bannerLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  bannerCaption: { color: '#EDF6FF', fontSize: 11 },
  bannerTrack: { width: '92%', marginTop: 5 },
  bannerPercent: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  shortcuts: { flexDirection: 'row', gap: 6 },
  shortcut: { flex: 1, minWidth: 0, minHeight: 67, borderWidth: StyleSheet.hairlineWidth, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 7, paddingHorizontal: 3, gap: 4 },
  shortcutLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  group: { gap: 6 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  weekToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 8 },
  small: { fontSize: 11, fontWeight: '600' },
  bars: { flexDirection: 'row', minHeight: 64, alignItems: 'flex-end' },
  barDay: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: 16, borderRadius: 5, opacity: 0.75 },
  rows: { gap: 6 },
  search: { minHeight: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, fontSize: 14 },
});
