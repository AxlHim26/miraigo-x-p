import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyText, useStudyColors } from '@/components/ui/study-screen';

const guides = [100, 75, 50, 25, 0];
const plotHeight = 130;

export type AccuracyPoint = { label: string; key: string; value: number | null };

export function StudyAccuracyChart({ points, emptyLabel }: { points: readonly AccuracyPoint[]; emptyLabel: string }) {
  const colors = useStudyColors();
  const [width, setWidth] = useState(0);
  const actual = points.flatMap((point, index) => point.value === null ? [] : [{
    ...point,
    value: point.value,
    x: 4 + Math.max(0, width - 8) * index / (points.length - 1),
    y: plotHeight * (1 - point.value / 100),
  }]);
  if (!actual.length) return <StudyText>{emptyLabel}</StudyText>;

  return (
    <View style={styles.chart} accessible accessibilityLabel={actual.map((point) => `${point.label}: ${Math.round(point.value)}%`).join(', ')}>
      <View style={styles.axis}>
        {guides.map((number) => <Text key={number} style={[styles.axisText, { color: colors.secondary }]}>{number}%</Text>)}
      </View>
      <View style={styles.chartBody}>
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.plot}>
          {guides.map((number) => (
            <View key={number} style={[styles.guide, { top: plotHeight * (1 - number / 100), backgroundColor: colors.divider }]} />
          ))}
          {width > 0 && actual.map((point, index) => {
            const previous = actual[index - 1];
            if (!previous) return null;
            const dx = point.x - previous.x;
            const dy = point.y - previous.y;
            const length = Math.hypot(dx, dy);
            return (
              <View key={point.key} style={[styles.segment, {
                width: length, left: (point.x + previous.x - length) / 2,
                top: (point.y + previous.y) / 2, backgroundColor: colors.icon,
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              }]} />
            );
          })}
          {width > 0 && actual.map((point) => (
            <View key={point.key} style={[styles.point, {
              left: point.x - 3.5, top: point.y - 3.5, borderColor: colors.icon, backgroundColor: colors.surface,
            }]} />
          ))}
        </View>
        <View style={styles.chartLabels}>
          {points.map((point) => <Text key={point.key} style={[styles.axisText, { color: colors.secondary }]}>{point.label}</Text>)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: 5, paddingTop: 6, paddingBottom: 3 },
  axis: { height: plotHeight + 10, justifyContent: 'space-between', alignItems: 'flex-end', width: 30, marginTop: -5 },
  axisText: { fontSize: 10, fontVariant: ['tabular-nums'] },
  chartBody: { flex: 1, minWidth: 0 },
  plot: { height: plotHeight },
  guide: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  segment: { position: 'absolute', height: 2, borderRadius: 1 },
  point: { position: 'absolute', width: 7, height: 7, borderRadius: 4, borderWidth: 1.5 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 7, gap: 3 },
});
