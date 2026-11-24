import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyAccuracyChart } from '@/components/ui/study-accuracy-chart';
import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyPanel, StudyPills, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { readingIcons } from '@/features/reading/components/reading-ui';
import { readingDate, readingDays, readingTotals, type ReadingProgress } from '@/features/reading/data/reading-progress';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';

const ranges = ['7 ngày', '30 ngày', 'Tất cả'] as const;
const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function ReadingStatistics() {
  return <StudyScreen title="Thống kê" largeTitle back="/practice/reading"><StatisticsContent /></StudyScreen>;
}

function StatisticsContent() {
  const colors = useStudyColors();
  const study = useReadingProgress();
  const [selection, setSelection] = useState<typeof ranges[number]>('7 ngày');
  const range = selection === 'Tất cả' ? 'all' : selection === '30 ngày' ? 30 : 7;
  const [completed, questions, correct] = readingTotals(study.progress, range);
  const metrics = [
    { label: 'Đã đọc', result: `${completed} bài`, icon: readingIcons.book },
    { label: 'Đã trả lời', result: `${questions} câu`, icon: readingIcons.repeat },
    { label: 'Độ chính xác', result: questions ? `${Math.round(correct / questions * 100)}%` : '—', icon: readingIcons.target },
  ];
  return (
    <>
      <StudyPills options={ranges} current={selection} onSelect={setSelection} />
      <View style={styles.metrics}>
        {metrics.map(({ label, result, icon }) => (
          <StudyPanel key={label} style={styles.metric}>
            <StudyIcon name={icon} color={colors.icon} size={24} />
            <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
            <Text style={[styles.result, { color: colors.title }]}>{study.ready ? result : '—'}</Text>
          </StudyPanel>
        ))}
      </View>
      <StudyPanel>
        <StudyText heading>Tiến độ luyện đọc</StudyText>
        <StudyText>{range === 'all' ? 'Độ chính xác trong 30 ngày gần nhất' : 'Độ chính xác theo thời gian'}</StudyText>
        <StudyAccuracyChart points={progressPoints(study.progress, range === 7 ? 7 : 30)}
          emptyLabel="Hoàn thành một bài đọc để xem biểu đồ." />
      </StudyPanel>
      {study.readError && <StudyActionButton secondary label="Tải lại thống kê" onPress={() => void study.retry()} />}
    </>
  );
}

function progressPoints(progress: ReadingProgress, days: 7 | 30) {
  const history = readingDays(progress, days);
  const size = days === 7 ? 1 : 5;
  return Array.from({ length: days / size }, (_, index) => {
    const chunk = history.slice(index * size, index * size + size);
    const date = chunk[chunk.length - 1].date;
    const asked = chunk.reduce((total, { values }) => total + values[1], 0);
    const correct = chunk.reduce((total, { values }) => total + values[2], 0);
    return {
      key: readingDate(date),
      label: days === 7 ? weekday[date.getDay()] : `${date.getDate()}/${date.getMonth() + 1}`,
      value: asked ? correct / asked * 100 : null,
    };
  });
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 6 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4, gap: 3 },
  label: { fontSize: 11, textAlign: 'center' },
  result: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
