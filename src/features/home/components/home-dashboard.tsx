import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLearnerPalette } from '@/components/ui/learner-glass';
import { StudyIcon } from '@/components/ui/study-icon';
import { studyColors, type StudyColors } from '@/constants/study-colors';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useLearnerProfile } from '@/features/auth/profile/use-learner-profile';
import { useCourseLearning } from '@/features/courses/hooks/use-course-learning';
import { useResumeLesson } from '@/features/courses/hooks/use-resume-lesson';
import { orderedLessons } from '@/features/courses/utils/course-outline';
import { dailyExercises, homeSymbols, shortcuts } from '@/features/home/data/home-study';
import { useDailyStudy } from '@/features/home/hooks/use-daily-study';
import { useHomeData } from '@/features/home/hooks/use-home-data';
import { studyWeek, useStudyTime } from '@/features/home/hooks/use-study-time';

function cardStyle(colors: StudyColors) {
  return { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 5px 14px ${colors.shadow}` };
}

const courseCover = require('@/assets/images/listening-fuji.jpg') as number;

export function HomeDashboard() {
  const router = useRouter();
  const { dark } = useLearnerPalette();
  const colors = studyColors[dark ? 'dark' : 'light'];
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.3 || width < 350 ? 2 : 4;
  const rows = Array.from({ length: shortcuts.length / columns }, (_, index) =>
    shortcuts.slice(index * columns, (index + 1) * columns));
  const user = useCurrentUser().data;
  const courses = useHomeData().data;
  const recent = useResumeLesson();
  const study = useDailyStudy();
  const [showPlan, setShowPlan] = useState(false);

  const savedCourse = courses?.find((course) => course.id === recent?.courseId);
  const course = savedCourse ?? courses?.[0];
  const lessons = course ? orderedLessons(course) : [];
  const position = savedCourse ? lessons.findIndex(({ lesson }) => lesson.id === recent?.lessonId) + 1 : 0;
  const learning = useCourseLearning(course?.id ?? 0);
  const displayName = useLearnerProfile().data.displayName || user?.username;
  const completed = lessons.filter(({ lesson }) => learning.completed.includes(lesson.id)).length;
  const progress = lessons.length ? Math.round(completed / lessons.length * 100) : 0;
  const resume = recent && (!courses || position > 0) ? recent : null;
  const nextHref: Href = resume
    ? { pathname: '/courses/[courseId]/lessons/[lessonId]', params: { courseId: resume.courseId, lessonId: resume.lessonId } }
    : course ? { pathname: '/courses/[courseId]', params: { courseId: course.id } } : '/courses';
  const level = course?.name.match(/\bN[1-5]\b/i)?.[0].toUpperCase();
  const card = cardStyle(colors);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.greeting, { color: colors.secondary }]}>{displayName ? `こんにちは、${displayName}` : 'こんにちは！'}</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.title }]}>Học tiếng Nhật</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Nhắc học hôm nay" onPress={() => setShowPlan(true)}
            style={({ pressed }) => [styles.round, card, pressed && styles.pressed]}>
            <StudyIcon name={homeSymbols.bell} color={colors.icon} size={23} />
            {study.available && study.completed.length < dailyExercises.length && <View style={[styles.dot, { backgroundColor: colors.icon }]} />}
          </Pressable>
        </View>

        <Pressable accessibilityRole="link" accessibilityLabel={resume ? `Tiếp tục ${resume.title}` : course?.name ?? 'Xem khóa học'}
          onPress={() => router.navigate(nextHref)} style={({ pressed }) => [styles.course, pressed && styles.pressed]}>
          <Image accessible={false} source={courseCover} contentFit="cover" style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={styles.courseVeil} />
          <View style={styles.courseCopy}>
            <Text style={styles.courseTitle}>{level ?? course?.name ?? 'Khóa học'}</Text>
            <Text style={styles.courseSubtitle}>{learning.ready && lessons.length ? `Đã học ${completed}/${lessons.length} bài` : resume?.title ?? 'Xem lộ trình học'}</Text>
            <View style={styles.progressRow}>
              <View style={styles.track}><View style={[styles.progress, { width: `${progress}%` }]} /></View>
              {learning.ready && <Text style={styles.percent}>{progress}%</Text>}
            </View>
          </View>
          <View style={styles.courseNext}><StudyIcon name={homeSymbols.next} color={studyColors.light.icon} size={17} /></View>
        </Pressable>

        <View style={styles.row}>
          <View style={[styles.stat, card]}>
            <StudyIcon name={homeSymbols.flame} color={colors.icon} size={26} />
            <View style={styles.statCopy}>
              <Text style={[styles.statNumber, { color: colors.title }]}>{study.available ? `${study.streak} ngày` : '—'}</Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>Học liên tiếp</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Xem mục tiêu hôm nay"
            style={({ pressed }) => [styles.stat, card, pressed && styles.pressed]} onPress={() => setShowPlan(true)}>
            <StudyIcon name={homeSymbols.goal} color={colors.icon} size={26} />
            <View style={styles.statCopy}>
              <Text style={[styles.statNumber, { color: colors.title }]}>{study.available ? `${study.completed.length}/${dailyExercises.length} bài` : '—'}</Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>Mục tiêu hôm nay</Text>
            </View>
          </Pressable>
        </View>

        <StudyTimeChart colors={colors} />

        <View style={styles.shortcuts}>
          {rows.map((row) => (
            <View key={row[0].title} style={styles.row}>
              {row.map((shortcut) => (
                <Pressable
                  key={shortcut.title}
                  accessibilityRole="link"
                  onPress={() => router.navigate(shortcut.href)}
                  style={({ pressed }) => [styles.shortcut, card, pressed && styles.pressed]}>
                  <StudyIcon name={shortcut.glyph} color={colors.icon} size={25} />
                  <Text style={[styles.shortcutLabel, { color: colors.text }]}>{shortcut.title}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      <Modal visible={showPlan} transparent animationType="fade" onRequestClose={() => setShowPlan(false)}>
        <SafeAreaView style={styles.modal}>
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => setShowPlan(false)} />
          <View accessibilityViewIsModal style={[styles.plan, { backgroundColor: colors.background }]}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.title }]}>Bài luyện tập hôm nay</Text>
            {dailyExercises.map((exercise) => {
              const checked = study.completed.includes(exercise.id);
              const disabled = !study.available || study.saving;
              return (
                <View key={exercise.id} style={[styles.planRow, { borderBottomColor: colors.divider }]}>
                  <Pressable accessibilityRole="link" style={styles.planLink} onPress={() => {
                    setShowPlan(false);
                    router.navigate(exercise.href);
                  }}>
                    <StudyIcon name={exercise.glyph} color={colors.icon} size={20} />
                    <Text style={[styles.planLabel, { color: colors.text }]}>{exercise.title} · {exercise.detail}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="checkbox" accessibilityLabel={`Hoàn thành ${exercise.title.toLowerCase()}`}
                    accessibilityState={{ checked, disabled }} disabled={disabled} style={styles.checkTarget} onPress={() => study.toggle(exercise.id)}>
                    <View style={[styles.check, { borderColor: checked ? colors.green : colors.secondary, backgroundColor: checked ? colors.green : 'transparent' }]}>
                      {checked && <StudyIcon name={homeSymbols.check} color={dark ? '#07281F' : '#FFFFFF'} size={13} />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
            {study.readError && <Pressable accessibilityRole="button" onPress={() => void study.retryRead()}><Text style={{ color: colors.blue }}>Tải lại dấu hoàn thành</Text></Pressable>}
            {study.saveError && <Text accessibilityLiveRegion="polite" style={{ color: colors.secondary }}>Chưa lưu được thay đổi.</Text>}
            <Pressable accessibilityRole="button" onPress={() => setShowPlan(false)} style={styles.close}><Text style={{ color: colors.blue }}>Đóng</Text></Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

function StudyTimeChart({ colors }: { colors: StudyColors }) {
  const { days } = useStudyTime();
  const [previous, setPrevious] = useState(false);
  const week = studyWeek(days, previous);
  const max = Math.max(60, ...week.map((day) => day.seconds));
  return (
    <View style={[styles.chart, cardStyle(colors)]}>
      <View style={styles.chartHeading}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.title }]}>Thời gian học</Text>
        <Pressable accessibilityRole="button" accessibilityHint="Đổi tuần hiển thị" onPress={() => setPrevious((value) => !value)}
          style={[styles.week, { backgroundColor: colors.iconFill }]}>
          <Text style={[styles.weekLabel, { color: colors.text }]}>{previous ? 'Tuần trước' : 'Tuần này'}</Text>
          <StudyIcon name={homeSymbols.down} color={colors.icon} size={12} />
        </Pressable>
      </View>
      <View style={styles.chartBars}>
        {week.map(({ label, seconds }) => (
          <View key={label} accessible accessibilityLabel={`${label}, ${Math.floor(seconds / 60)} phút học`} style={styles.chartDay}>
            <View style={[styles.bar, {
              height: seconds > 0 ? Math.max(4, seconds / max * 47) : 2,
              backgroundColor: seconds > 0 ? colors.icon : colors.track,
              opacity: seconds > 0 ? 0.7 : 1,
            }]} />
            <Text style={[styles.dayLabel, { color: colors.secondary }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 700, alignSelf: 'center', paddingTop: 13, paddingHorizontal: 17, paddingBottom: 24, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 4, paddingBottom: 3 },
  headerCopy: { flex: 1, minWidth: 0, gap: 4 },
  greeting: { fontSize: 14 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  round: { width: 47, height: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  dot: { position: 'absolute', top: 5, right: 6, width: 9, height: 9, borderRadius: 5 },
  course: { minHeight: 149, flexDirection: 'row', alignItems: 'flex-end', gap: 12, padding: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: '#3C6890' },
  courseVeil: { ...StyleSheet.absoluteFill, backgroundColor: '#172B4C25', backgroundImage: 'linear-gradient(90deg, rgba(20,45,78,0.78), rgba(29,56,90,0.38) 54%, rgba(25,47,74,0.02))' },
  courseCopy: { flex: 1, gap: 5 },
  courseTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 34, lineHeight: 39 },
  courseSubtitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 20 },
  track: { flex: 1, height: 9, backgroundColor: '#FFFFFF55', borderRadius: 10, overflow: 'hidden' },
  progress: { height: '100%', borderRadius: 10, backgroundColor: '#FFFFFF' },
  percent: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  courseNext: { width: 37, height: 37, backgroundColor: '#F3F7FB', borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, minHeight: 64, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth },
  statCopy: { flexShrink: 1, gap: 1 },
  statNumber: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  chart: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 13, gap: 9 },
  chartHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  week: { minHeight: 29, borderRadius: 15, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekLabel: { fontSize: 12, fontWeight: '600' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 66 },
  chartDay: { flex: 1, gap: 6, alignItems: 'center' },
  bar: { width: 17, borderRadius: 5 },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  shortcuts: { gap: 10 },
  shortcut: { flex: 1, minWidth: 0, minHeight: 73, alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 3, paddingVertical: 8, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  shortcutLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  pressed: { opacity: 0.68 },
  modal: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, backgroundColor: '#18212B66' },
  plan: { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 21, padding: 16, gap: 6 },
  planRow: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: StyleSheet.hairlineWidth },
  planLink: { flex: 1, alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 8 },
  planLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  checkTarget: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  check: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  close: { minHeight: 44, paddingHorizontal: 8, alignSelf: 'flex-end', justifyContent: 'center' },
});
