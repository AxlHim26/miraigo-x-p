import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import {
  ListeningActionButton, ListeningFrame, ListeningIconButton, ListeningLessonRow, ListeningPanel, ListeningPills,
  ListeningProgressBar, ListeningRing, ListeningText, listeningCovers, listeningIcons, useListeningColors,
} from '@/features/listening/components/listening-ui';
import { listeningLessons, listeningLevels, type ListeningLevel } from '@/features/listening/data/listening-lessons';
import { isListeningReviewDue, lessonCompleted, listeningDays, type ListeningProgress } from '@/features/listening/data/listening-progress';
import { useListeningProgress } from '@/features/listening/hooks/use-listening-progress';

const home = '/practice/listening';
const sections = [
  { title: 'Bài nghe', icon: listeningIcons.play, mode: 'all' },
  { title: 'Theo chủ đề', icon: listeningIcons.topics, mode: 'topics' },
  { title: 'Chính tả', icon: listeningIcons.pencil, mode: 'dictation' },
  { title: 'Ôn tập', icon: listeningIcons.repeat, mode: 'review' },
  { title: 'Yêu thích', icon: listeningIcons.heart, mode: 'favorites' },
] as const;
const libraryPills = ['Tất cả', 'Chưa học', 'Đang học', 'Đã xong'] as const;
const reviewPills = ['Tất cả', 'Cần ôn', 'Đã thành thạo'] as const;
const topics = [...new Set(listeningLessons.map((lesson) => lesson.topic))];
const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function ListeningHome() {
  const router = useRouter();
  const user = useCurrentUser().data;
  const study = useListeningProgress();
  return (
    <ListeningFrame
      title="Luyện nghe"
      hint={user?.username ? `Xin chào, ${user.username}` : 'Xin chào'}
      action={<ListeningIconButton icon={listeningIcons.chart} label="Thống kê luyện nghe" onPress={() => router.push('/practice/listening/stats')} />}>
      <HomeContent study={study} />
    </ListeningFrame>
  );
}

function HomeContent({ study }: { study: ReturnType<typeof useListeningProgress> }) {
  const router = useRouter();
  const colors = useListeningColors();
  const { width, fontScale } = useWindowDimensions();
  const { progress } = study;
  const recent = [...listeningLessons]
    .filter((lesson) => progress.lessons[lesson.id]?.opened)
    .sort((a, b) => progress.lessons[b.id].opened - progress.lessons[a.id].opened)[0];
  const level = recent?.level ?? 'N5';
  const levelLessons = listeningLessons.filter((lesson) => lesson.level === level);
  const completed = levelLessons.filter((lesson) => lessonCompleted(lesson, progress.lessons[lesson.id])).length;
  const fraction = completed / levelLessons.length;

  function openSection(mode: typeof sections[number]['mode']) {
    if (mode === 'dictation') router.push({ pathname: '/practice/listening/exercise', params: { level, mode: 'choice' } });
    else router.push({ pathname: '/practice/listening/library', params: { mode, level } });
  }

  return (
    <>
      <Pressable accessibilityRole="link" accessibilityLabel={`Luyện nghe ${level}, ${Math.round(fraction * 100)}% hoàn thành`}
        onPress={() => openSection('all')}
        style={({ pressed }) => [styles.banner, { backgroundColor: colors.iconFill, opacity: pressed ? 0.75 : 1 }]}>
        <Image accessible={false} source={listeningCovers.fuji} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: 0.53 }]} />
        <View style={styles.bannerCopy}>
          <Text style={[styles.level, { color: colors.title }]}>{level}</Text>
          <Text style={[styles.small, { color: colors.text }]}>Tiến độ luyện nghe</Text>
          <Text style={[styles.small, { color: colors.secondary }]}>{completed}/{levelLessons.length} bài hoàn thành</Text>
        </View>
        <ListeningRing progress={fraction}>
          <Text style={[styles.percent, { color: colors.title }]}>{Math.round(fraction * 100)}%</Text>
        </ListeningRing>
      </Pressable>

      <View style={[styles.shortcuts, (width < 350 || fontScale > 1.25) && styles.shortcutsWrapped]}>
        {sections.map((section) => (
          <Pressable key={section.mode} accessibilityRole="button" onPress={() => openSection(section.mode)}
            style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
            <View style={[styles.shortcutIcon, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 2px 7px ${colors.shadow}` }]}>
              <StudyIcon name={section.icon} color={colors.icon} size={20} />
            </View>
            <Text style={[styles.shortcutLabel, { color: colors.text }]}>{section.title}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.group}>
        <ListeningText heading>{recent ? 'Bài nghe gần nhất' : 'Bắt đầu luyện nghe'}</ListeningText>
        <ListeningLessonRow
          lesson={recent ?? levelLessons[0]}
          subtitle={`${level} · ${(recent ?? levelLessons[0]).lines.length} câu`}
          onPress={() => router.push({ pathname: '/practice/listening/[lessonId]', params: { lessonId: (recent ?? levelLessons[0]).id } })}
        />
      </View>

      <ListeningPanel>
        <ListeningText heading>Lịch sử luyện nghe (7 ngày)</ListeningText>
        <ListeningHistory progress={progress} />
      </ListeningPanel>
      {study.readError && <ListeningActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
    </>
  );
}

function ListeningHistory({ progress }: { progress: ListeningProgress }) {
  const colors = useListeningColors();
  const history = listeningDays(progress, 7);
  const max = Math.max(1, ...history.map(({ values }) => values[0]));
  return (
    <View style={styles.history}>
      {history.map(({ day, values }) => (
        <View key={day.toISOString()} accessible accessibilityLabel={`${weekday[day.getDay()]}, ${values[0]} bài hoàn thành`} style={styles.historyDay}>
          <View style={[styles.historyBar, { height: values[0] ? Math.max(5, values[0] / max * 53) : 3, backgroundColor: values[0] ? colors.icon : colors.track }]} />
          <Text style={[styles.small, { color: colors.secondary }]}>{weekday[day.getDay()]}</Text>
        </View>
      ))}
    </View>
  );
}

export function ListeningLibrary() {
  const { level: requestedLevel, mode } = useLocalSearchParams<{ level?: string; mode?: string }>();
  const [level, setLevel] = useState<ListeningLevel>(listeningLevels.find((item) => item === requestedLevel) ?? 'N5');
  const reviewing = mode === 'review';
  const favorites = mode === 'favorites';
  const byTopic = mode === 'topics';
  const title = reviewing ? 'Ôn tập' : favorites ? 'Yêu thích' : byTopic ? 'Luyện theo chủ đề' : `${level} · Luyện nghe`;
  return (
    <ListeningFrame title={title} back={home}>
      <LibraryContent level={level} setLevel={setLevel} reviewing={reviewing} favorites={favorites} byTopic={byTopic} />
    </ListeningFrame>
  );
}

function LibraryContent({ level, setLevel, reviewing, favorites, byTopic }: {
  level: ListeningLevel;
  setLevel: (level: ListeningLevel) => void;
  reviewing: boolean;
  favorites: boolean;
  byTopic: boolean;
}) {
  const router = useRouter();
  const colors = useListeningColors();
  const { progress, readError, retry } = useListeningProgress();
  const [filter, setFilter] = useState<typeof libraryPills[number]>('Tất cả');
  const [reviewFilter, setReviewFilter] = useState<typeof reviewPills[number]>('Tất cả');
  const [topic, setTopic] = useState('Tất cả');
  const [reviewNow, setReviewNow] = useState(Date.now);
  const levelLessons = listeningLessons.filter((lesson) => lesson.level === level);
  const completed = levelLessons.filter((lesson) => lessonCompleted(lesson, progress.lessons[lesson.id])).length;

  useFocusEffect(useCallback(() => { setReviewNow(Date.now()); }, []));

  const visible = (reviewing || favorites || byTopic ? listeningLessons : levelLessons).filter((lesson) => {
    const status = progress.lessons[lesson.id];
    if (favorites) return status?.favorite;
    if (reviewing) return status?.due && (reviewFilter === 'Tất cả' || isListeningReviewDue(status, reviewNow) === (reviewFilter === 'Cần ôn'));
    if (byTopic) return topic === 'Tất cả' || lesson.topic === topic;
    if (filter === 'Chưa học') return !status?.opened;
    const done = lessonCompleted(lesson, status);
    if (filter === 'Đang học') return !!status?.opened && !done;
    return filter !== 'Đã xong' || done;
  });

  return (
    <>
      {!reviewing && !favorites && !byTopic && (
        <>
          <ListeningPills options={listeningLevels} current={level} onSelect={setLevel} />
          <ListeningPanel style={styles.libraryBanner}>
            <Image accessible={false} source={listeningCovers.fuji} contentFit="cover" style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: 0.65 }]} />
            <View style={styles.levelLine}>
              <StudyIcon name={listeningIcons.headphones} color={colors.icon} size={22} />
              <Text style={[styles.level, { color: colors.title }]}>{level}</Text>
            </View>
            <Text style={[styles.small, { color: colors.text }]}>{completed} / {levelLessons.length} bài đã hoàn thành</Text>
            <View style={styles.progressLine}>
              <ListeningProgressBar fraction={completed / levelLessons.length} style={styles.progressFill} />
              <Text style={[styles.small, { color: colors.title }]}>{Math.round(completed / levelLessons.length * 100)}%</Text>
            </View>
          </ListeningPanel>
          <ListeningPills options={libraryPills} current={filter} onSelect={setFilter} />
        </>
      )}
      {byTopic && <ListeningPills options={['Tất cả', ...topics]} current={topic} onSelect={setTopic} />}
      {reviewing && (
        <>
          <ListeningPanel><ListeningText>Ôn lại những bài đã nghe để ghi nhớ lâu hơn.</ListeningText></ListeningPanel>
          <ListeningPills options={reviewPills} current={reviewFilter} onSelect={setReviewFilter} />
        </>
      )}
      {readError && <ListeningActionButton secondary label="Tải lại tiến độ" onPress={() => void retry()} />}
      {visible.length === 0 && (
        <ListeningPanel>
          <ListeningText>{favorites ? 'Chưa có bài nghe yêu thích.' : reviewing ? 'Chưa có bài nghe trong nhóm này.' : 'Chưa có bài ở bộ lọc này.'}</ListeningText>
        </ListeningPanel>
      )}
      <View style={styles.rows}>
        {visible.map((lesson) => {
          const status = progress.lessons[lesson.id];
          const mastered = reviewing && status ? !isListeningReviewDue(status, reviewNow) : false;
          const done = reviewing ? mastered : lessonCompleted(lesson, status);
          const due = status?.due ? new Date(status.due) : null;
          const subtitle = reviewing && due
            ? status.due <= reviewNow ? 'Đến lịch ôn' : `Ôn ngày ${due.getDate()}/${due.getMonth() + 1}`
            : `${lesson.level} · ${lesson.lines.length} câu · ${lesson.topic}`;
          return (
            <ListeningLessonRow
              key={lesson.id}
              lesson={lesson}
              subtitle={subtitle}
              done={done}
              badge={reviewing ? mastered ? 'Thành thạo' : 'Cần ôn' : undefined}
              onPress={() => reviewing
                ? router.push({ pathname: '/practice/listening/exercise', params: { lessonId: lesson.id, mode: 'meaning', review: '1' } })
                : router.push({ pathname: '/practice/listening/[lessonId]', params: { lessonId: lesson.id } })}
            />
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  banner: { overflow: 'hidden', borderRadius: 21, minHeight: 132, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerCopy: { flex: 1, gap: 5 },
  level: { fontSize: 25, fontWeight: '800', letterSpacing: -0.4 },
  percent: { fontSize: 17, fontWeight: '800' },
  small: { fontSize: 12, fontWeight: '500' },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', columnGap: 5, rowGap: 8 },
  shortcutsWrapped: { flexWrap: 'wrap' },
  shortcut: { flexGrow: 1, flexBasis: 57, paddingHorizontal: 1, minHeight: 63, alignItems: 'center', gap: 5 },
  shortcutIcon: { width: 39, height: 39, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { textAlign: 'center', fontSize: 11, lineHeight: 14, fontWeight: '600' },
  pressed: { opacity: 0.62 },
  group: { gap: 7 },
  history: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 77, paddingHorizontal: 4, paddingVertical: 4 },
  historyDay: { flex: 1, alignItems: 'center', gap: 5 },
  historyBar: { width: 15, borderRadius: 5, opacity: 0.57 },
  libraryBanner: { minHeight: 103, overflow: 'hidden', padding: 13 },
  levelLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressFill: { flex: 1 },
  rows: { gap: 7 },
});
