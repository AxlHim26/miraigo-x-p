import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyAccuracyChart } from '@/components/ui/study-accuracy-chart';
import { StudyIcon } from '@/components/ui/study-icon';
import { StudyPanel, StudyPills, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { LearnerLoadState } from '@/components/ui/learner-detail';
import { useDailyStudy } from '@/features/home/hooks/use-daily-study';
import { studyWeek, useStudyTime } from '@/features/home/hooks/use-study-time';
import { listeningTotals } from '@/features/listening/data/listening-progress';
import { useListeningProgress } from '@/features/listening/hooks/use-listening-progress';
import { readingTotals } from '@/features/reading/data/reading-progress';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';
import { VocabularyRow, vocabularyIcons } from '@/features/vocabulary/components/vocabulary-ui';
import { vocabularyDay, vocabularyDays } from '@/features/vocabulary/data/vocabulary-study';
import { useVocabularyProgress, useVocabularyWords } from '@/features/vocabulary/hooks/use-vocabulary-data';
import { useVocabularyQuizHistory, vocabularyAccuracy } from '@/features/vocabulary/hooks/use-vocabulary-quiz-history';

const periods = ['7 ngày', '30 ngày', 'Tất cả'] as const;

export function VocabularyStatistics() {
  return (
    <StudyScreen title="Thống kê" largeTitle back="/vocabulary">
      <StatisticsContent />
    </StudyScreen>
  );
}

function StatisticsContent() {
  const colors = useStudyColors();
  const [period, setPeriod] = useState<typeof periods[number]>('7 ngày');
  const [now] = useState(() => new Date());
  const range = period === 'Tất cả' ? 'all' : period === '30 ngày' ? 30 : 7;
  const { progress, stats } = useVocabularyProgress();
  const catalog = useVocabularyWords(undefined, undefined, false);
  const activity = useVocabularyQuizHistory();
  const accuracy = vocabularyAccuracy(activity.data, range, now);
  const since = range !== 'all' ? vocabularyDay(vocabularyDays(range, now)[0]) : null;
  const records = progress.data ?? [];
  const started = range === 'all' && stats.data ? stats.data.totalLearning
    : progress.data && records.filter((record) => record.createdAt && (!since || record.createdAt.slice(0, 10) >= since)).length;
  const reviewed = progress.data && records.filter((record) =>
    record.lastReviewedAt && (!since || record.lastReviewedAt.slice(0, 10) >= since)).length;
  const total = catalog.catalog.hasNextPage ? 0 : catalog.courses.reduce((sum, course) => sum + course.totalWords, 0);
  const days = vocabularyDays(range === 7 ? 7 : 30, now).filter((_, index) => range === 7 || (index + 1) % 5 === 0);
  const points = days.map((date) => {
    const key = vocabularyDay(date);
    const learned = records.filter((record) => record.createdAt && record.createdAt.slice(0, 10) <= key).length;
    return {
      key,
      label: range === 7 ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()] : `${date.getDate()}/${date.getMonth() + 1}`,
      value: total && records.length ? Math.min(100, 100 * learned / total) : null,
    };
  });
  const metrics = [
    { label: 'Đã học', value: started, icon: vocabularyIcons.book },
    { label: 'Đã ôn', value: reviewed, icon: vocabularyIcons.repeat },
    { label: 'Độ chính xác', value: accuracy === null ? null : `${accuracy}%`, icon: vocabularyIcons.check },
  ];
  return (
    <>
      <StudyPills options={periods} current={period} onSelect={setPeriod} />
      <View style={styles.metrics}>
        {metrics.map(({ label, value, icon }) => (
          <StudyPanel key={label} style={styles.metric}>
            <View style={[styles.icon, { backgroundColor: colors.iconFill }]}><StudyIcon name={icon} color={colors.icon} size={18} /></View>
            <Text style={[styles.value, { color: colors.title }]}>{value ?? '—'}</Text>
            <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
          </StudyPanel>
        ))}
      </View>
      <LearnerLoadState pending={progress.isFetching && !progress.data} error={progress.error} retry={() => void progress.refetch()} />
      <StudyPanel>
        <StudyText heading>Tiến độ học</StudyText>
        <StudyText>{range === 'all' ? 'Tỷ lệ từ đã học trong 30 ngày gần nhất' : 'Tỷ lệ từ đã học trong thư viện'}</StudyText>
        <StudyAccuracyChart points={points} emptyLabel="Bắt đầu học từ vựng để xem tiến độ." />
      </StudyPanel>
      {activity.error && <StudyText>Chưa đọc được kết quả bài tập trên thiết bị.</StudyText>}
    </>
  );
}

export function LearnerProgressScreen() {
  return <StudyScreen title="Tiến độ" largeTitle><ProgressOverview /></StudyScreen>;
}

function ProgressOverview() {
  const router = useRouter();
  const time = useStudyTime();
  const daily = useDailyStudy();
  const { stats } = useVocabularyProgress();
  const listening = useListeningProgress();
  const reading = useReadingProgress();
  const minutes = Math.floor(studyWeek(time.days, false).reduce((sum, day) => sum + day.seconds, 0) / 60);
  const listened = listeningTotals(listening.progress, 'all')[0];
  const read = readingTotals(reading.progress, 'all')[0];
  return (
    <>
      <StudyPanel>
        <StudyText heading>Tiến độ tuần này</StudyText>
        <StudyText>{minutes} phút học trên thiết bị</StudyText>
        {daily.available && <StudyText>{daily.streak} ngày học liên tiếp</StudyText>}
      </StudyPanel>
      <VocabularyRow title="Từ vựng" subtitle={stats.data ? `${stats.data.totalLearning} từ đã học` : 'Thống kê từ vựng'}
        icon={vocabularyIcons.book} onPress={() => router.push('/vocabulary/stats')} />
      <VocabularyRow title="Luyện nghe" subtitle={`${listened} bài đã hoàn thành`} icon={vocabularyIcons.speaker}
        onPress={() => router.push('/practice/listening/stats')} />
      <VocabularyRow title="Luyện đọc" subtitle={reading.ready ? `${read} bài đã hoàn thành` : 'Thống kê luyện đọc'}
        icon={vocabularyIcons.book} onPress={() => router.push('/practice/reading/stats')} />
      <VocabularyRow title="Ôn tập hôm nay" subtitle={stats.data ? `${stats.data.dueForReview} từ đến hạn` : 'Lịch ôn từ vựng'}
        icon={vocabularyIcons.repeat} onPress={() => router.push('/vocabulary/review')} />
    </>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 7 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 5, gap: 3 },
  icon: { width: 33, height: 33, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, textAlign: 'center' },
});
