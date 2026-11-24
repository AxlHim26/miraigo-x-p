import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { getHttpUrl, LearnerLoadState } from '@/components/ui/learner-detail';
import { useLearnerPalette } from '@/components/ui/learner-glass';
import { LessonPdf, LessonVideo } from '@/components/ui/lesson-media';
import { StudyIcon, studySymbol } from '@/components/ui/study-icon';
import { env } from '@/core/config/env';
import { studyColors, type StudyColors } from '@/constants/study-colors';
import { LessonMenu } from '@/features/courses/components/lesson-menu';
import { lessonIcons } from '@/features/courses/data/lesson-icons';
import { useCourseLearning } from '@/features/courses/hooks/use-course-learning';
import { chapterHref, courseHref, courseLevel, courseMediaHref, lessonHref } from '@/features/courses/utils/course-navigation';
import { useCourse } from '@/features/courses/hooks/use-course';
import { useRememberLesson } from '@/features/courses/hooks/use-resume-lesson';
import type { Course } from '@/features/courses/services/course-service';
import { orderedLessons } from '@/features/courses/utils/course-outline';
import { useDeviceBookmark } from '@/shared/hooks/use-device-bookmark';
import { parseRouteId } from '@/shared/utils/route-id';

type LessonEntry = ReturnType<typeof orderedLessons>[number];
const lessonTabs = [
  'Nội dung', 'Tài liệu', 'Bài tập',
] as const;
const chevronDown = studySymbol('chevron.down', 'expand_more');
const documentIcon = studySymbol('doc.text', 'description');

export function CourseLessonScreen() {
  const router = useRouter();
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const id = parseRouteId(courseId);
  const lesson = parseRouteId(lessonId);
  const query = useCourse(id);
  const course = query.data;
  const lessons = course ? orderedLessons(course) : [];
  const index = lessons.findIndex((item) => item.lesson.id === lesson);
  const current = lessons[index];
  const { dark } = useLearnerPalette();
  const colors = studyColors[dark ? 'dark' : 'light'];
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(current && id ? chapterHref(id, current.chapter.id) : id ? courseHref(id) : '/courses');
  };

  useRememberLesson(id, current?.lesson.id, current?.lesson.title);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <View pointerEvents="none" style={[styles.sky, {
          backgroundColor: colors.sky,
          backgroundImage: `linear-gradient(180deg, ${colors.sky}, ${colors.background})`,
        }]}>
          <View style={[styles.wave, { backgroundColor: colors.wave }]} />
          <View style={[styles.crest, { backgroundColor: colors.crest }]} />
          <View style={[styles.fade, { backgroundImage: `linear-gradient(180deg, transparent, ${colors.background})` }]} />
        </View>
        {course && current ? (
          <LessonPage
            key={`${course.id}:${current.lesson.id}`}
            course={course}
            current={current}
            outline={lessons.filter((entry) => entry.chapter.id === current.chapter.id)}
            next={lessons[index + 1]}
            previous={lessons[index - 1]}
            colors={colors}
            back={back}
          />
        ) : (
          <>
            <LessonHeader colors={colors} back={back} />
            <LearnerLoadState
              pending={query.isFetching && !course}
              missing={!id || !lesson || Boolean(course && !current)}
              error={query.error}
              retry={() => void query.refetch()}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function LessonHeader({ colors, back, actions }: { colors: StudyColors; back: () => void; actions?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Về lộ trình khóa học" onPress={back} style={({ pressed }) => [styles.roundButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
        <StudyIcon name={lessonIcons.back} color={colors.icon} size={20} />
      </Pressable>
      <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.title }]}>Video bài học</Text>
      <View style={styles.headerActions}>{actions}</View>
    </View>
  );
}

function LessonPage({ course, current, outline, previous, next, colors, back }: {
  course: Course;
  current: LessonEntry;
  outline: LessonEntry[];
  previous?: LessonEntry;
  next?: LessonEntry;
  colors: StudyColors;
  back: () => void;
}) {
  const router = useRouter();
  const { chapter, lesson, section } = current;
  const bookmark = useDeviceBookmark(`lesson.${course.id}.${lesson.id}`);
  const learning = useCourseLearning(course.id);
  const completed = learning.completed.includes(lesson.id);
  const [menu, setMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof lessonTabs[number]>(lessonTabs[0]);
  const [linkError, setLinkError] = useState(false);
  const video = getHttpUrl(lesson.videoUrl);
  const pdf = getHttpUrl(lesson.pdfUrl);
  const position = learning.positions[lesson.id];
  const mediaSource = video?.split(/[?#]/)[0] ?? '';
  const thumbnail = getHttpUrl(course.thumbnailUrl);
  const description = chapter.description?.trim();
  const detail = Array.from(new Set([chapter.title, section.title])).filter(Boolean).join(' · ');
  const surface: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    boxShadow: `0px 3px 9px ${colors.shadow}`,
  };
  const title = (
    <View style={styles.titleBlock}>
      <View style={styles.titleCopy}>
        <Text accessibilityRole="header" style={[styles.lessonTitle, { color: colors.title }]}>{lesson.title}</Text>
        <Text style={[styles.courseName, { color: colors.secondary }]}>{detail || course.name}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tùy chọn bài học"
        onPress={() => setMenu(true)}
        style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
        <StudyIcon name={chevronDown} color={colors.icon} size={17} />
      </Pressable>
    </View>
  );

  function openVideo(url: string) {
    setLinkError(false);
    void Linking.openURL(url).catch(() => setLinkError(true));
  }

  return (
    <>
      <LessonHeader colors={colors} back={back} actions={(
        <>
          <Pressable
            accessibilityRole="togglebutton"
            accessibilityLabel="Lưu bài học"
            accessibilityState={{ checked: bookmark.saved, disabled: !bookmark.enabled }}
            disabled={!bookmark.enabled}
            onPress={bookmark.toggle}
            style={({ pressed }) => [styles.roundButton, { backgroundColor: colors.surface }, (pressed || !bookmark.enabled) && styles.pressed]}>
            <StudyIcon name={bookmark.saved ? lessonIcons.bookmarked : lessonIcons.bookmark} color={colors.icon} size={20} />
          </Pressable>
        </>
      )} />
      {bookmark.failed && <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.secondary }]}>Chưa lưu được dấu trang bài học.</Text>}

      {video ? (
        <LessonVideo
          url={video}
          poster={thumbnail}
          colors={colors}
          resumeTime={position?.source === mediaSource ? position.seconds : undefined}
          onPosition={(seconds, duration) => learning.rememberPosition(lesson.id, { source: mediaSource, seconds, duration })}
          onComplete={() => learning.complete(lesson.id)}
          downloadKey={bookmark.userId ? `${bookmark.userId}-${course.id}-${lesson.id}` : undefined}>
          {title}
        </LessonVideo>
      ) : (
        <>
          {title}
          <View style={[styles.card, surface]}>
            <Text style={[styles.feedback, { color: colors.secondary }]}>
              {pdf ? 'Bài học này có tài liệu PDF.' : 'Bài học này chưa có video hoặc tài liệu.'}
            </Text>
          </View>
        </>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {lessonTabs.map((tab) => {
          const selected = activeTab === tab;
          return (
            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [styles.tab, { backgroundColor: selected ? '#383F48' : colors.surface }, pressed && styles.pressed]}>
              <Text style={[styles.tabLabel, { color: selected ? '#FFFFFF' : colors.text }]}>{tab}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTab === 'Bài tập' && (
        <Pressable accessibilityRole="link" onPress={() => router.push({
          pathname: '/practice/catalog', params: { kind: 'grammar', level: courseLevel(course) ?? 'N5' },
        })} style={({ pressed }) => [styles.card, surface, styles.related, pressed && styles.pressed]}>
          <Text style={[styles.rowTitle, { color: colors.title }]}>Luyện ngữ pháp theo cấp độ</Text>
          <StudyIcon name={lessonIcons.next} color={colors.icon} size={15} />
        </Pressable>
      )}
      {activeTab === 'Nội dung' && (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.title }]}>Nội dung bài học</Text>
          <View style={[styles.card, surface]}>
            {outline.map(({ lesson: entry }) => {
              const selected = entry.id === lesson.id;
              return (
                <Pressable key={entry.id} accessibilityRole="link" accessibilityState={{ selected, disabled: selected }} disabled={selected}
                  onPress={() => router.replace(lessonHref(course.id, entry.id))}
                  style={({ pressed }) => [styles.outlineRow, selected && { backgroundColor: colors.iconFill }, pressed && styles.pressed]}>
                  <View style={[styles.outlineIcon, { backgroundColor: selected ? colors.surface : colors.iconFill }]}>
                    <StudyIcon name={lessonIcons.play} color={colors.icon} size={12} />
                  </View>
                  <Text style={[styles.rowTitle, { color: selected ? colors.blue : colors.text }]}>{entry.title}</Text>
                  {selected && <Text style={[styles.currentLabel, { color: colors.blue }]}>Đang xem</Text>}
                </Pressable>
              );
            })}
            {!!description && <Text style={[styles.feedback, styles.description, { color: colors.secondary }]}>{description}</Text>}
          </View>
        </View>
      )}

      {activeTab === 'Tài liệu' && (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.title }]}>Tài liệu</Text>
          <View style={[styles.card, surface]}>
            <View style={styles.document}>
              <View style={[styles.documentIcon, { backgroundColor: colors.iconFill }]}>
                <StudyIcon name={documentIcon} color={colors.icon} size={22} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.title }]}>Tài liệu bài học (PDF)</Text>
            </View>
            {pdf ? <LessonPdf key={pdf} url={pdf} /> : <Text style={{ color: colors.secondary }}>Chưa có tài liệu cho bài này.</Text>}
          </View>
        </View>
      )}
      <Pressable accessibilityRole="button" disabled={!learning.ready || completed}
        accessibilityState={{ disabled: !learning.ready || completed }} onPress={() => learning.complete(lesson.id)}
        style={({ pressed }) => [styles.card, surface, styles.related, pressed && styles.pressed]}>
        <Text style={[styles.rowTitle, { color: colors.title }]}>{completed ? 'Đã hoàn thành bài học' : 'Đánh dấu đã hoàn thành'}</Text>
        <StudyIcon name={lessonIcons.check} color={colors.icon} size={18} />
      </Pressable>
      {next && <Pressable accessibilityRole="link" onPress={() => router.replace(lessonHref(course.id, next.lesson.id))}
        style={({ pressed }) => [styles.card, surface, styles.related, pressed && styles.pressed]}>
        <Text style={[styles.rowTitle, { color: colors.title }]}>Bài tiếp theo · {next.lesson.title}</Text>
        <StudyIcon name={lessonIcons.next} color={colors.icon} size={18} />
      </Pressable>}
      {learning.failed && <Text style={{ color: colors.secondary }}>Chưa lưu được tiến độ trên thiết bị.</Text>}
      {linkError && <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.secondary }]}>Không mở được liên kết video.</Text>}
      {menu && (
        <LessonMenu
          title="Tùy chọn bài học"
          colors={colors}
          close={() => setMenu(false)}
          items={[
            ...(video && !env.demoMode ? [{ label: 'Mở video bằng trình duyệt', onPress: () => openVideo(video) }] : []),
            { label: 'Thêm vào danh sách phát', onPress: () => {
              const destination = courseMediaHref(course.id, 'playlists');
              router.push({ ...destination, params: { ...destination.params, lessonId: lesson.id } });
            } },
            ...(previous ? [{ label: 'Về bài trước', onPress: () => router.replace(lessonHref(course.id, previous.lesson.id)) }] : []),
            { label: 'Về lộ trình khóa học', onPress: back },
          ]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 26, gap: 12 },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: 230, overflow: 'hidden' },
  wave: { position: 'absolute', left: '21%', top: 73, width: '78%', height: 85, borderRadius: '50%', transform: [{ rotate: '-12deg' }], opacity: 0.4 },
  crest: { position: 'absolute', left: '56%', top: 58, width: '72%', height: 101, borderRadius: '50%', transform: [{ rotate: '-15deg' }], opacity: 0.35 },
  fade: { position: 'absolute', top: 90, left: 0, right: 0, bottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, minHeight: 49, paddingHorizontal: 2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 44 },
  roundButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, boxShadow: '0px 3px 8px rgba(35,91,147,0.09)' },
  pressed: { opacity: 0.68 },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 3, gap: 6 },
  titleCopy: { flex: 1, minWidth: 0, gap: 3 },
  lessonTitle: { fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: -0.35 },
  courseName: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
  tabs: { flexGrow: 1, flexDirection: 'row', gap: 6, paddingVertical: 2 },
  tab: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', minHeight: 39, borderRadius: 22, paddingHorizontal: 13 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2, paddingHorizontal: 3 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 8, gap: 4 },
  related: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 47, paddingHorizontal: 12, gap: 6 },
  outlineRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  outlineIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: '600' },
  currentLabel: { fontSize: 11, fontWeight: '600' },
  feedback: { fontSize: 13, lineHeight: 19 },
  description: { paddingHorizontal: 8, paddingBottom: 5 },
  document: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 3 },
  documentIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
