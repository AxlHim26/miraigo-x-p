import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { StudyPills, StudyScreen, useStudyColors } from '@/components/ui/study-screen';
import { env } from '@/core/config/env';
import { demoCourses } from '@/integrations/demo/demo-data';
import { ProfileMenuRow, ProfileTrack } from '@/features/auth/profile/profile-menu-ui';
import { useCourseCompletions } from '@/features/courses/hooks/use-course-learning';
import { courseLevel } from '@/features/courses/utils/course-navigation';
import { useDailyStudy } from '@/features/home/hooks/use-daily-study';
import { useHomeData } from '@/features/home/hooks/use-home-data';
import { useStudyTime } from '@/features/home/hooks/use-study-time';

const icons = {
  start: studySymbol('crown.fill', 'workspace_premium'),
  streak: studySymbol('flame.fill', 'local_fire_department'),
  calendar: studySymbol('calendar', 'calendar_month'),
  course: studySymbol('book', 'menu_book'),
  trophy: studySymbol('trophy.fill', 'emoji_events'),
  check: studySymbol('checkmark', 'check'),
  lock: studySymbol('lock.fill', 'lock'),
};
const filters = ['Tất cả', 'Học tập', 'Liên tiếp', 'Đặc biệt'] as const;
type Filter = typeof filters[number];

type Badge = {
  title: string;
  subtitle: string;
  category: Exclude<Filter, 'Tất cả'>;
  icon: StudySymbol;
  tone?: 'blue' | 'gold' | 'coral';
  progress: number;
  value?: string;
};

export function ProfileAchievements() {
  const [filter, select] = useState<Filter>('Tất cả');
  const daily = useDailyStudy();
  const { days } = useStudyTime();
  const { data: courses } = useHomeData();
  const completions = useCourseCompletions(courses ?? (env.demoMode ? demoCourses : []));
  const starter = daily.streak > 0 || Object.values(days ?? {}).some((seconds) => seconds > 0) || completions.some((entry) => entry.completed > 0);
  const n5 = completions.find(({ course }) => courseLevel(course) === 'N5');
  const n5Progress = n5?.total ? n5.completed / n5.total : 0;
  const completedLevels = new Set(completions.flatMap(({ course, total, completed }) => {
    const level = courseLevel(course);
    return level && total > 0 && completed === total ? [level] : [];
  })).size;
  const badges: Badge[] = [
    { title: 'Bắt đầu hành trình', subtitle: 'Hoàn thành bài học đầu tiên', category: 'Học tập', icon: icons.start, tone: 'gold', progress: Number(starter) },
    { title: 'Học đều đặn', subtitle: 'Học liên tiếp 7 ngày', category: 'Liên tiếp', icon: icons.streak, tone: 'coral', progress: daily.streak / 7, value: `${daily.streak} / 7` },
    { title: 'Thói quen tốt', subtitle: 'Học liên tiếp 30 ngày', category: 'Liên tiếp', icon: icons.calendar, progress: daily.streak / 30, value: `${daily.streak} / 30` },
    { title: 'Chinh phục N5', subtitle: 'Hoàn thành 100% khóa N5', category: 'Học tập', icon: icons.course, progress: n5Progress, value: `${Math.round(n5Progress * 100)}%` },
    { title: 'Học giả Nhật ngữ', subtitle: 'Hoàn thành 3 cấp độ', category: 'Đặc biệt', icon: icons.trophy, tone: 'gold',
      progress: completedLevels / 3, value: completedLevels > 0 ? `${completedLevels} / 3` : undefined },
  ];
  return (
    <StudyScreen title="Thành tích" back="/account" largeTitle>
      <StudyPills options={filters} current={filter} onSelect={select} />
      <View style={styles.list}>
        {badges.filter((badge) => filter === 'Tất cả' || badge.category === filter).map((badge) => (
          <AchievementBadge key={badge.title} {...badge} />
        ))}
      </View>
    </StudyScreen>
  );
}

function AchievementBadge({ title, subtitle, icon, tone, progress, value }: Badge) {
  const colors = useStudyColors();
  const earned = progress >= 1;
  const showTrack = !earned && !!value;
  const state = earned ? (
    <View accessibilityLabel="Đã đạt" style={styles.check}><StudyIcon name={icons.check} size={10} color="#FFFFFF" /></View>
  ) : showTrack ? undefined : <StudyIcon name={icons.lock} size={15} color={colors.secondary} />;
  return (
    <ProfileMenuRow title={title} subtitle={subtitle} icon={icon} tone={tone} value={showTrack ? value : undefined} end={state}>
      {showTrack && <ProfileTrack progress={progress} />}
    </ProfileMenuRow>
  );
}

const styles = StyleSheet.create({
  list: { gap: 7 },
  check: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#219944', alignItems: 'center', justifyContent: 'center' },
});
