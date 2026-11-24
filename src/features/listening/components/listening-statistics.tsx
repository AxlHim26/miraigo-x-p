import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyAccuracyChart } from '@/components/ui/study-accuracy-chart';
import { StudyIcon } from '@/components/ui/study-icon';
import {
  ListeningActionButton, ListeningFrame, ListeningPanel, ListeningPills, ListeningText, listeningIcons, useListeningColors,
} from '@/features/listening/components/listening-ui';
import { listeningDays, listeningTotals, type ListeningProgress } from '@/features/listening/data/listening-progress';
import { useListeningProgress } from '@/features/listening/hooks/use-listening-progress';

const ranges = ['7 ngày', '30 ngày', 'Tất cả'] as const;
const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function ListeningStatistics() {
  return (
    <ListeningFrame title="Thống kê" back="/practice/listening">
      <StatisticsContent />
    </ListeningFrame>
  );
}

function StatisticsContent() {
  const colors = useListeningColors();
  const study = useListeningProgress();
  const [choice, setChoice] = useState<typeof ranges[number]>('7 ngày');
  const range = choice === 'Tất cả' ? 'all' : choice === '30 ngày' ? 30 : 7;
  const [heard, reviewed, correct, questions] = listeningTotals(study.progress, range);
  const values = [
    { label: 'Đã nghe', value: `${heard} bài`, icon: listeningIcons.headphones },
    { label: 'Đã ôn', value: `${reviewed} bài`, icon: listeningIcons.repeat },
    { label: 'Độ chính xác', value: questions ? `${Math.round(correct / questions * 100)}%` : '—', icon: listeningIcons.target },
  ];

  return (
    <>
      <ListeningPills options={ranges} current={choice} onSelect={setChoice} />
      <View style={styles.metrics}>
        {values.map(({ label, value, icon }) => (
          <ListeningPanel key={label} style={styles.metric}>
            <StudyIcon name={icon} color={colors.icon} size={21} />
            <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: colors.title }]}>{value}</Text>
          </ListeningPanel>
        ))}
      </View>
      <ListeningPanel>
        <ListeningText heading>Tiến độ luyện nghe</ListeningText>
        <ListeningText>{range === 'all' ? 'Độ chính xác trong 30 ngày gần nhất' : 'Độ chính xác theo lần luyện'}</ListeningText>
        <StudyAccuracyChart points={chartPoints(study.progress, range === 7 ? 7 : 30)}
          emptyLabel="Hoàn thành một bài luyện để xem biểu đồ độ chính xác." />
      </ListeningPanel>
      {study.readError && <ListeningActionButton secondary label="Tải lại thống kê" onPress={() => void study.retry()} />}
    </>
  );
}

function chartPoints(progress: ListeningProgress, range: 7 | 30) {
  const days = listeningDays(progress, range);
  const groupSize = range === 7 ? 1 : 5;
  return Array.from({ length: days.length / groupSize }, (_, index) => {
    const group = days.slice(index * groupSize, (index + 1) * groupSize);
    const first = group[0].day;
    const last = group[group.length - 1].day;
    const correct = group.reduce((sum, day) => sum + day.values[2], 0);
    const questions = group.reduce((sum, day) => sum + day.values[3], 0);
    return {
      label: range === 7 ? weekdays[first.getDay()] : `${last.getDate()}/${last.getMonth() + 1}`,
      key: first.toISOString(),
      value: questions ? 100 * correct / questions : null,
    };
  });
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 6 },
  metric: { flex: 1, minWidth: 0, paddingHorizontal: 8, gap: 4 },
  label: { fontSize: 11, lineHeight: 14 },
  metricValue: { fontSize: 17, fontWeight: '800' },
});
