import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LearnerLoadState } from '@/components/ui/learner-detail';
import { StudyIcon } from '@/components/ui/study-icon';
import { studyColors } from '@/constants/study-colors';
import {
  StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors,
} from '@/components/ui/study-screen';
import { VocabularyRow, vocabularyArt, vocabularyIcons } from '@/features/vocabulary/components/vocabulary-ui';
import { vocabularyDay, vocabularyFilters, vocabularySessionHref, wordsForFilter, wordsMatching, type VocabularyFilter } from '@/features/vocabulary/data/vocabulary-study';
import {
  useVocabularyFavorites, useVocabularyProgress, useVocabularyWords, vocabularyLevels, type VocabularyLevel,
} from '@/features/vocabulary/hooks/use-vocabulary-data';
import { parseRouteId } from '@/shared/utils/route-id';

const root = '/vocabulary';
const shortcuts = [
  { label: 'Học mới', mode: 'new', icon: vocabularyIcons.plus },
  { label: 'Ôn tập', mode: 'due', icon: vocabularyIcons.repeat },
  { label: 'Flashcard', mode: 'flashcard', icon: vocabularyIcons.flashcards },
  { label: 'Bài tập', mode: 'quiz', icon: vocabularyIcons.target },
] as const;

export function VocabularyDashboard() {
  const [searching, setSearching] = useState(false);
  return (
    <StudyScreen title="Từ vựng" largeTitle
      action={<StudyIconButton icon={vocabularyIcons.search} label={searching ? 'Đóng tìm kiếm' : 'Tìm từ vựng'}
        selected={searching} onPress={() => setSearching((open) => !open)} />}>
      {searching ? <VocabularySearch /> : <VocabularyOverview />}
    </StudyScreen>
  );
}

function VocabularyOverview() {
  const router = useRouter();
  const colors = useStudyColors();
  const data = useVocabularyWords(undefined, undefined, false);
  const { progress } = useVocabularyProgress();
  const [today] = useState(vocabularyDay);
  const active = vocabularyLevels.find((level) => {
    const atLevel = data.courses.filter((course) => course.level?.toUpperCase() === level);
    return atLevel.length > 0;
  });
  const levelCourses = data.courses.filter((course) => !active || course.level?.toUpperCase() === active);
  const levelIds = new Set(levelCourses.map((course) => course.id));
  const total = levelCourses.reduce((sum, course) => sum + course.totalWords, 0);
  const learned = progress.data?.filter((entry) => levelIds.has(entry.courseId)).length;
  const fraction = data.catalog.isSuccess && !data.catalog.hasNextPage && total > 0 && learned !== undefined
    ? Math.min(1, learned / total) : null;
  const todayCount = progress.data?.filter((entry) => entry.createdAt?.slice(0, 10) === today).length;
  const openTopics = () => router.push({ pathname: '/vocabulary/topics', params: { ...(active ? { level: active } : {}) } });

  return (
    <>
      <Pressable accessibilityRole="link" accessibilityLabel="Mở thư viện từ vựng" onPress={openTopics}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
        <Image accessible={false} source={vocabularyArt} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.overlay} />
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{active ?? 'Từ vựng'}</Text>
          <Text style={styles.heroCopy}>{fraction !== null ? `Đang học · ${Math.round(fraction * 100)}%` : 'Lộ trình từ vựng JLPT'}</Text>
          <View style={styles.heroTrack}><View style={[styles.heroFill, { width: `${(fraction ?? 0) * 100}%` }]} /></View>
        </View>
        <View style={styles.heroNext}><StudyIcon name={vocabularyIcons.next} color={studyColors.light.icon} size={18} /></View>
      </Pressable>
      <View style={styles.shortcuts}>
        {shortcuts.map((item) => (
          <Pressable accessibilityRole="link" onPress={() => item.mode === 'due' ? router.push('/vocabulary/review') : router.push(vocabularySessionHref(item.mode, active))}
            key={item.mode} style={({ pressed }) => [styles.shortcut, {
              backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 8px ${colors.shadow}`, opacity: pressed ? 0.65 : 1,
            }]}>
            <StudyIcon name={item.icon} color={colors.icon} size={23} />
            <Text style={[styles.shortcutLabel, { color: colors.text }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionHeading}>
        <StudyText heading>Hôm nay</StudyText>
        <Pressable accessibilityRole="link" hitSlop={6} onPress={openTopics} style={styles.inline}>
          <Text style={{ color: colors.secondary, fontSize: 13 }}>Xem tất cả</Text>
          <StudyIcon name={vocabularyIcons.next} color={colors.icon} size={12} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="link" accessibilityLabel="Học từ mới hôm nay" onPress={() => router.push(vocabularySessionHref('new', active))}>
        <StudyPanel style={styles.daily}>
          <View style={[styles.dailyIcon, { backgroundColor: colors.iconFill }]}>
            <StudyIcon name={vocabularyIcons.book} color={colors.icon} size={23} />
          </View>
          <View style={styles.dailyText}>
            <Text style={[styles.wordTitle, { color: colors.title }]}>Học 20 từ mới</Text>
            <Text style={[styles.small, { color: colors.secondary }]}>Mục tiêu từ vựng hôm nay</Text>
            <StudyProgressBar fraction={Math.min(1, (todayCount ?? 0) / 20)} />
          </View>
          <StudyRing size={52} progress={(todayCount ?? 0) / 20}>
            <Text style={[styles.small, { color: colors.title }]}>{todayCount === undefined ? '—' : `${todayCount}/20`}</Text>
          </StudyRing>
        </StudyPanel>
      </Pressable>
      <VocabularyRow icon={vocabularyIcons.book} title="Bảng chữ" subtitle="Hiragana và Katakana" onPress={() => router.push('/kana')} />
      <VocabularyRow icon={vocabularyIcons.list} title="Hán tự" subtitle="Tra cứu và ôn chữ Kanji" onPress={() => router.push('/kanji')} />
      <VocabularyRow icon={vocabularyIcons.chart} title="Thống kê từ vựng" onPress={() => router.push('/vocabulary/stats')} />
      <VocabularyRow icon={vocabularyIcons.topic} title="Bộ từ cá nhân và cộng đồng" onPress={() => router.push('/vocabulary/sets')} />
      {data.error && <LearnerLoadState pending={false} error={data.error} retry={data.retry} />}
    </>
  );
}

function VocabularySearch() {
  const colors = useStudyColors();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(24);
  const result = useVocabularyWords(undefined, undefined, !!search.trim());
  const matches = wordsMatching(result.words, search);
  return (
    <>
      <TextInput value={search} onChangeText={(value) => { setSearch(value); setLimit(24); }} autoFocus autoCapitalize="none"
        accessibilityLabel="Tìm từ vựng" placeholder="Nhập từ, cách đọc hoặc nghĩa" placeholderTextColor={colors.secondary}
        style={[styles.search, { color: colors.title, backgroundColor: colors.surface, borderColor: colors.border }]} />
      {!!search.trim() && (
        <>
          <LearnerLoadState pending={result.pending} error={result.error} retry={result.retry} />
          <WordsList words={matches.slice(0, limit)} />
          {!matches.length && !result.pending && !result.error && <StudyPanel><StudyText>Không tìm thấy từ phù hợp.</StudyText></StudyPanel>}
          {matches.length > limit && <StudyActionButton label="Xem thêm kết quả" secondary onPress={() => setLimit((value) => value + 24)} />}
          {result.catalog.hasNextPage && <StudyActionButton secondary label="Tìm trong các chủ đề tiếp theo"
            disabled={result.catalog.isFetchingNextPage} onPress={() => void result.catalog.fetchNextPage()} />}
        </>
      )}
    </>
  );
}

export function VocabularyTopics() {
  const { level: requested, courseId: course, filter: requestedFilter } = useLocalSearchParams<{ level?: string; courseId?: string; filter?: string }>();
  const id = parseRouteId(course);
  const [level, setLevel] = useState<VocabularyLevel | 'all'>(vocabularyLevels.find((value) => value === requested) ?? 'all');
  const [levelsOpen, setLevelsOpen] = useState(false);
  const title = level === 'all' ? 'Từ vựng theo chủ đề' : `${level} · Từ vựng`;
  return (
    <StudyScreen title={title} largeTitle back={root}
      action={!id && <StudyIconButton icon={vocabularyIcons.options} label="Chọn cấp độ JLPT" selected={levelsOpen}
        onPress={() => setLevelsOpen((open) => !open)} />}>
      {levelsOpen && <StudyPills options={['Tất cả', ...vocabularyLevels]} current={level === 'all' ? 'Tất cả' : level}
        onSelect={(value) => setLevel(value === 'Tất cả' ? 'all' : value)} />}
      <TopicsContent key={`${id ?? 'all'}:${level}`} courseId={id ?? undefined} level={level}
        initialFilter={vocabularyFilters.find((value) => value === requestedFilter) ?? 'Tất cả'} />
    </StudyScreen>
  );
}

function TopicsContent({ courseId, level, initialFilter }: { courseId?: number; level: VocabularyLevel | 'all'; initialFilter: VocabularyFilter }) {
  const router = useRouter();
  const [filter, setFilter] = useState(initialFilter);
  const [limit, setLimit] = useState(28);
  const needsWords = !!courseId || filter !== 'Tất cả';
  const data = useVocabularyWords(level, courseId, needsWords);
  const { byId, progress } = useVocabularyProgress();
  const favorites = useVocabularyFavorites(data.words, filter === 'Yêu thích');
  const filtered = wordsForFilter(data.words, filter, byId, new Set(favorites.data));
  const courses = data.courses.filter((course) => level === 'all' || course.level?.toUpperCase() === level);
  const needsProgress = filter === 'Chưa học' || filter === 'Đã học';
  const pending = data.pending || (needsProgress && progress.isFetching) || (filter === 'Yêu thích' && favorites.isFetching);
  const filterUnavailable = (needsProgress && !progress.data) || (filter === 'Yêu thích' && !favorites.data);
  const error = data.error ?? (needsProgress ? progress.error : filter === 'Yêu thích' ? favorites.error : null);
  const courseTitle = data.courses.find((course) => course.id === courseId)?.title;
  const studyMode = {
    'Tất cả': 'flashcard', 'Chưa học': 'new', 'Đã học': 'known', 'Yêu thích': 'favorites',
  }[filter];

  return (
    <>
      <StudyPills options={vocabularyFilters} current={filter} onSelect={(value) => { setFilter(value); setLimit(28); }} />
      {!!courseTitle && <StudyText heading>{courseTitle}</StudyText>}
      <LearnerLoadState pending={pending} error={error} retry={() => {
        data.retry();
        if (progress.isError) void progress.refetch();
        if (favorites.isError) void favorites.refetch();
      }} />
      {courseId ? (
        <>
          {filtered.length > 0 && !filterUnavailable && <>
            <StudyActionButton tone="ink" label="Học chủ đề này"
              onPress={() => router.push(vocabularySessionHref(studyMode, level, courseId))} />
            <WordsList words={filtered.slice(0, limit)} />
            {filtered.length > limit && <StudyActionButton secondary label="Xem thêm từ" onPress={() => setLimit((value) => value + 28)} />}
          </>}
          {!pending && !error && !filtered.length && <StudyPanel><StudyText>Chưa có từ trong bộ lọc này.</StudyText></StudyPanel>}
        </>
      ) : (
        <View style={styles.rows}>
          {courses.map((course) => {
            const count = filter === 'Tất cả' ? course.totalWords : filtered.filter((word) => word.courseId === course.id).length;
            return (filter === 'Tất cả' || (count > 0 && !filterUnavailable)) && (
              <VocabularyRow key={course.id} title={course.title} subtitle={`${count} từ`} icon={vocabularyIcons.topic}
                onPress={() => router.push({ pathname: '/vocabulary/[courseId]', params: { courseId: course.id, level, filter } })} />
            );
          })}
          {!pending && !error && (filter === 'Tất cả' ? !courses.length : !filtered.length) &&
            <StudyPanel><StudyText>Chưa có chủ đề trong bộ lọc này.</StudyText></StudyPanel>}
        </View>
      )}
      {!courseId && data.catalog.hasNextPage && <StudyActionButton secondary label="Tải thêm chủ đề"
        disabled={data.catalog.isFetchingNextPage} onPress={() => void data.catalog.fetchNextPage()} />}
    </>
  );
}

function WordsList({ words }: { words: ReturnType<typeof useVocabularyWords>['words'] }) {
  const router = useRouter();
  return (
    <View style={styles.rows}>
      {words.map((word) => (
        <VocabularyRow key={word.id} title={word.term} subtitle={word.meaning} icon={vocabularyIcons.book}
          onPress={() => router.push({ pathname: '/vocabulary/word/[wordId]', params: { wordId: word.id, courseId: word.courseId } })} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, minHeight: 143, padding: 15, flexDirection: 'row', alignItems: 'flex-end', gap: 14, overflow: 'hidden', backgroundColor: '#547998' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(31,66,106,0.42)', backgroundImage: 'linear-gradient(180deg, rgba(31,66,106,0.12), rgba(25,55,83,0.78))' },
  heroText: { flex: 1, gap: 5, minWidth: 0 },
  heroTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '800' },
  heroCopy: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  heroTrack: { width: '92%', height: 8, backgroundColor: '#FFFFFF50', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  heroFill: { height: '100%', borderRadius: 10, backgroundColor: '#FFFFFF' },
  heroNext: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FF' },
  shortcuts: { flexDirection: 'row', gap: 7 },
  shortcut: { flex: 1, minWidth: 0, minHeight: 70, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 3 },
  shortcutLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginTop: 3 },
  inline: { flexDirection: 'row', gap: 3, alignItems: 'center', minHeight: 26 },
  daily: { flexDirection: 'row', alignItems: 'center', minHeight: 76 },
  dailyIcon: { width: 42, height: 42, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dailyText: { flex: 1, minWidth: 0, gap: 4 },
  wordTitle: { fontSize: 15, fontWeight: '800' },
  small: { fontSize: 12, fontWeight: '500' },
  rows: { gap: 7 },
  pressed: { opacity: 0.72 },
  search: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 15, minHeight: 47 },
});
