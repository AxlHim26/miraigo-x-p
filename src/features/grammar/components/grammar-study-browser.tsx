import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { studyColors } from '@/constants/study-colors';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { GrammarRow, fujiCover, grammarIcons } from '@/features/grammar/components/grammar-study-ui';
import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';
import { grammarLevel } from '@/features/grammar/data/grammar-exercises';
import { grammarProgress, grammarStatus, grammarWeek, useGrammarStudy } from '@/features/grammar/hooks/use-grammar-study';
import { normalizeStudySearch } from '@/shared/utils/study-search';

const statuses = ['Tất cả', 'Chưa học', 'Đang học', 'Đã xong'] as const;
const reviewFilters = ['Tất cả', 'Cần ôn', 'Đã thành thạo'] as const;
const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const grammarPointHref = (pointId: string): Href => ({ pathname: '/grammar/point/[pointId]', params: { pointId } });

export function GrammarHome() {
  const user = useCurrentUser().data;
  const router = useRouter();
  return (
    <StudyScreen title="Ngữ pháp" largeTitle hint={user?.username ? `Xin chào, ${user.username}` : 'Xin chào'}
      action={<StudyIconButton icon={grammarIcons.sparkles} label="Tạo bài ngữ pháp bằng AI" onPress={() => router.push('/grammar/create')} />}>
      <GrammarOverview />
    </StudyScreen>
  );
}

function GrammarOverview() {
  const router = useRouter();
  const colors = useStudyColors();
  const study = useGrammarStudy();
  const [previous, setPrevious] = useState(false);
  const { entries, days } = study.state;
  const recent = grammarPoints.filter((point) => entries[point.id]?.opened)
    .sort((a, b) => entries[b.id].opened - entries[a.id].opened)[0];
  const level = (recent && grammarLevel(recent)) || grammarLevels[0];
  const points = grammarPoints.filter((point) => point.levelId === level.id);
  const completed = points.filter((point) => entries[point.id]?.completed).length;
  const fraction = completed / Math.max(points.length, 1);
  const point = recent ?? points[0];
  const status = grammarStatus(entries[point.id]);
  const progress = grammarProgress(entries[point.id]);
  const week = grammarWeek(days, previous);
  const max = Math.max(1, ...week.map((day) => day.total));
  const library: Href = { pathname: '/grammar/[levelId]', params: { levelId: level.id } };
  const shortcuts = [
    { label: 'Học mới', icon: grammarIcons.book, href: library },
    { label: 'Ôn tập', icon: grammarIcons.repeat, href: '/grammar/review' as const },
    { label: 'Bài tập', icon: grammarIcons.quiz, href: { pathname: '/grammar/exercises', params: { pointId: point.id } } as const },
    { label: 'Yêu thích', icon: grammarIcons.star, href: '/grammar/favorites' as const },
  ];
  return (
    <>
      <Pressable accessibilityRole="link" accessibilityLabel={`Ngữ pháp ${level.level}`} onPress={() => router.push(library)}
        style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.65 : 1 }]}>
        <Image accessible={false} source={fujiCover} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.bannerVeil} />
        <View style={styles.bannerCopy}>
          <Text style={styles.level}>{level.level}</Text>
          <Text style={styles.bannerLabel}>Tiến độ ngữ pháp</Text>
          <View style={styles.progress}>
            <StudyProgressBar fraction={fraction} tone="onBlue" style={styles.grow} />
            <Text style={styles.bannerLabel}>{study.ready ? `${Math.round(fraction * 100)}%` : '—'}</Text>
          </View>
        </View>
        <View style={styles.bannerButton}><StudyIcon name={grammarIcons.next} color={studyColors.light.icon} size={17} /></View>
      </Pressable>
      <View style={styles.shortcuts}>
        {shortcuts.map(({ label, icon, href }) => (
          <Pressable accessibilityRole="link" key={label} onPress={() => router.push(href)} style={({ pressed }) => [styles.shortcut, {
            backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 9px ${colors.shadow}`, opacity: pressed ? 0.7 : 1,
          }]}>
            <StudyIcon name={icon} color={colors.icon} size={22} />
            <Text style={[styles.shortcutText, { color: colors.text }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <StudyText heading>{recent ? 'Bài học gần đây' : 'Bắt đầu học ngữ pháp'}</StudyText>
      <GrammarRow title={point.title} titleBadge={level.level} subtitle={`${status}${status === 'Đang học' ? ` · ${Math.round(progress * 100)}%` : ''}`}
        end={grammarIcons.play} onPress={() => router.push(grammarPointHref(point.id))} />
      <StudyPanel>
        <View style={styles.between}>
          <StudyText heading>Tiến độ tuần này</StudyText>
          <Pressable accessibilityRole="button" accessibilityHint="Đổi tuần hiển thị" onPress={() => setPrevious((value) => !value)}
            style={[styles.weekToggle, { backgroundColor: colors.iconFill }]}>
            <Text style={[styles.shortcutText, { color: colors.blue }]}>{previous ? 'Tuần trước' : 'Tuần này'}</Text>
            <StudyIcon name={grammarIcons.down} color={colors.icon} size={12} />
          </Pressable>
        </View>
        <View style={styles.bars}>
          {week.map(({ label, total }) => (
            <View key={label} accessible accessibilityLabel={`${label}, ${total} mẫu đã hoàn thành`} style={styles.day}>
              <View style={[styles.bar, { height: total ? Math.max(6, total / max * 46) : 3, backgroundColor: total ? colors.icon : colors.track }]} />
              <Text style={[styles.shortcutText, { color: colors.secondary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </StudyPanel>
      {study.readError && <StudyActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
    </>
  );
}

export function GrammarLibrary() {
  const { levelId } = useLocalSearchParams<{ levelId?: string }>();
  const startingLevel = grammarLevels.find((item) => item.id === levelId)?.level ?? 'N5';
  return <GrammarShelf key={levelId} mode="library" initialLevel={startingLevel} />;
}

export function GrammarReview() {
  return <GrammarShelf mode="review" initialLevel="N5" />;
}

export function GrammarFavorites() {
  return <GrammarShelf mode="saved" initialLevel="N5" />;
}

function GrammarShelf({ mode, initialLevel }: { mode: 'library' | 'review' | 'saved'; initialLevel: typeof levels[number] }) {
  const [level, setLevel] = useState(initialLevel);
  const [searching, setSearching] = useState(false);
  return (
    <StudyScreen title={mode === 'library' ? `${level} · Ngữ pháp` : mode === 'review' ? 'Ôn tập' : 'Yêu thích'} largeTitle back="/grammar"
      action={<StudyIconButton icon={grammarIcons.search} label={searching ? 'Đóng tìm kiếm' : 'Tìm mẫu ngữ pháp'}
        selected={searching} onPress={() => setSearching((value) => !value)} />}>
      <ShelfContent key={level} mode={mode} level={level} changeLevel={setLevel} searching={searching} />
    </StudyScreen>
  );
}

function ShelfContent({ mode, level, changeLevel, searching }: {
  mode: 'library' | 'review' | 'saved'; level: typeof levels[number]; changeLevel: (level: typeof levels[number]) => void; searching: boolean;
}) {
  const router = useRouter();
  const colors = useStudyColors();
  const study = useGrammarStudy();
  const { entries } = study.state;
  const [status, setStatus] = useState<typeof statuses[number]>('Tất cả');
  const [review, setReview] = useState<typeof reviewFilters[number]>('Tất cả');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(24);
  const [now] = useState(Date.now);
  const query = searching ? normalizeStudySearch(search) : '';
  const due = (pointId: string) => !!entries[pointId]?.due && entries[pointId].due <= now;
  const isMastered = (pointId: string) => !!entries[pointId]?.mastered && !due(pointId);
  const visible = grammarPoints.filter((point) => {
    const entry = entries[point.id];
    if (mode === 'library' && (grammarLevel(point)?.level !== level || (status !== 'Tất cả' && grammarStatus(entry) !== status))) return false;
    if (mode === 'saved' && !entry?.saved) return false;
    if (mode === 'review' && (!entry?.due || (review === 'Cần ôn' && isMastered(point.id)) || (review === 'Đã thành thạo' && !isMastered(point.id)))) return false;
    return !query || normalizeStudySearch([point.title, point.structure, point.meaning, `Bài ${point.lesson}`, ...(point.tags ?? [])].join(' ')).includes(query);
  });
  if (mode === 'review') visible.sort((a, b) => entries[a.id].due - entries[b.id].due);

  return (
    <>
      {mode === 'library' && <StudyPills options={levels} current={level} onSelect={changeLevel} />}
      {searching && <TextInput accessibilityLabel="Tìm mẫu ngữ pháp" placeholder="Mẫu câu, nghĩa hoặc số bài" autoFocus autoCapitalize="none"
        placeholderTextColor={colors.secondary} value={search} onChangeText={(value) => { setSearch(value); setLimit(24); }}
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.title }]} />}
      {mode === 'library' && <StudyPills options={statuses} current={status} onSelect={(value) => { setStatus(value); setLimit(24); }} />}
      {mode === 'review' && <StudyPills options={reviewFilters} current={review} onSelect={(value) => { setReview(value); setLimit(24); }} />}
      {study.readError && <StudyActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
      {!visible.length && <StudyPanel>
        <StudyText>{!study.ready && !study.readError ? 'Đang tải tiến độ…' : mode === 'review' && !query ? 'Học hoặc làm bài tập để bắt đầu lịch ôn.' : 'Chưa có mẫu trong nhóm này.'}</StudyText>
      </StudyPanel>}
      {visible.slice(0, limit).map((point) => {
        const entry = entries[point.id];
        const state = grammarStatus(entry);
        const date = entry?.due ? new Date(entry.due) : null;
        const progress = grammarProgress(entry);
        const subtitle = mode === 'review' && date
          ? due(point.id) ? 'Đến lịch ôn' : `Ôn ngày ${date.getDate()}/${date.getMonth() + 1}`
          : state === 'Đang học' ? `${state} · ${Math.round(progress * 100)}%` : state;
        return (
          <GrammarRow key={point.id} title={point.title} titleBadge={grammarLevel(point)?.level} subtitle={subtitle}
            progress={mode !== 'review' && state === 'Đang học' ? progress : undefined}
            end={mode === 'review' || state === 'Đang học' ? grammarIcons.play : state === 'Đã xong' ? grammarIcons.check : grammarIcons.circle}
            onPress={() => mode === 'review' ? router.push({ pathname: '/grammar/exercises', params: { pointId: point.id } }) : router.push(grammarPointHref(point.id))} />
        );
      })}
      {visible.length > limit && <StudyActionButton secondary label="Xem thêm mẫu" onPress={() => setLimit((value) => value + 24)} />}
    </>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 128, overflow: 'hidden', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#2F71A2' },
  bannerVeil: { ...StyleSheet.absoluteFill, backgroundImage: 'linear-gradient(90deg, rgba(25,61,103,0.82), rgba(31,72,114,0.61) 53%, rgba(29,72,116,0.12))' },
  bannerCopy: { flex: 1, gap: 3 },
  level: { color: '#FFFFFF', fontSize: 31, fontWeight: '800' },
  bannerLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  progress: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 4 },
  grow: { flex: 1 },
  bannerButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F8FD', alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', gap: 7 },
  shortcut: { flex: 1, minWidth: 0, gap: 4, minHeight: 67, justifyContent: 'center', alignItems: 'center', borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 5 },
  shortcutText: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 5 },
  weekToggle: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 5 },
  bars: { minHeight: 63, alignItems: 'flex-end', flexDirection: 'row' },
  day: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: 15, borderRadius: 4, opacity: 0.77 },
  search: { minHeight: 44, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, fontSize: 14 },
});
