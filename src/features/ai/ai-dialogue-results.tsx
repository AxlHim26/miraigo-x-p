import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StudyActionButton, StudyPanel, StudyProgressBar, StudyRing, StudyScreen, StudyText } from '@/components/ui/study-screen';
import { env } from '@/core/config/env';
import type { AiScenario } from '@/features/ai/ai-catalog';
import { correctionOptions } from '@/features/ai/ai-service';
import { AiJapanese, AiPlay } from '@/features/ai/ai-ui';
import { callTime, type AiCall } from '@/features/ai/use-ai-workspace';

export function DialogueFeedback({ spoken, scene, busy, error, next }: { spoken: { text: string; score: number }; scene: AiScenario; busy: boolean; error: string; next: () => void }) {
  const correction = useQuery(correctionOptions(spoken.text, scene.level));
  return (
    <StudyScreen title="Phản hồi ngay" back="/practice/ai-dialogue" onBack={next}
      footer={<StudyActionButton label={busy ? 'Đang chuẩn bị lượt tiếp…' : 'Tiếp tục hội thoại'} disabled={busy} onPress={next} />}>
      <StudyText heading>Câu bạn vừa nói</StudyText>
      <StudyPanel><View style={styles.row}>
        <View style={styles.fill}><AiJapanese text={spoken.text} /></View><AiPlay text={spoken.text} />
      </View></StudyPanel>
      <StudyText heading>Đánh giá</StudyText>
      <View style={styles.center}><StudyRing size={106} progress={spoken.score / 100}><StudyText heading>{spoken.score} / 100</StudyText>
        <StudyText>{env.demoMode ? 'Điểm mẫu' : 'Khớp câu mẫu'}</StudyText></StudyRing></View>
      {env.demoMode && <StudyPanel>
        {metrics(spoken.score).map(([label, number]) => <View key={label} style={styles.row}>
          <StudyText>{label}</StudyText><StudyProgressBar fraction={number / 100} style={styles.fill} /><StudyText>{number}</StudyText>
        </View>)}
      </StudyPanel>}
      {correction.data && <StudyPanel>
        <StudyText heading>Nhận xét</StudyText><StudyText>{correction.data.explanation}</StudyText>
        <StudyText heading>Gợi ý nâng cao</StudyText><AiJapanese text={correction.data.natural} />
        <StudyText>{correction.data.translation}</StudyText>
      </StudyPanel>}
      {correction.isError && <StudyActionButton secondary label="Thử tải lại nhận xét" onPress={() => void correction.refetch()} />}
      {!!error && <StudyText>{error}</StudyText>}
    </StudyScreen>
  );
}

export function DialogueResult({ summary, back, error, doneLabel, saving, done, restart }: {
  summary: AiCall;
  back: Href;
  error: string;
  doneLabel: string;
  saving: boolean;
  done: () => void;
  restart: () => void;
}) {
  return (
    <StudyScreen title="Kết quả luyện nói" back={back}
      footer={<StudyActionButton label={doneLabel} disabled={saving} onPress={done} />}>
      <View style={styles.center}><StudyRing size={135} progress={summary.average / 100}><StudyText heading>{summary.average} / 100</StudyText>
        <StudyText>{summary.average >= 80 ? 'Rất tốt!' : 'Tiếp tục luyện nhé'}</StudyText></StudyRing></View>
      {env.demoMode && <View style={styles.row}>
        {metrics(summary.average).map(([label, score]) => <StudyPanel key={label} style={styles.fill}><StudyText>{label}</StudyText><StudyText heading>{score}</StudyText></StudyPanel>)}
      </View>}
      <StudyPanel>
        <StudyText heading>Tổng kết</StudyText>
        <StudyText>{summary.turns} lượt nói · {callTime(summary.duration)}</StudyText>
        {!!summary.best && <AiJapanese text={summary.best} />}
        {summary.turns > 0 && <StudyText>{summary.tip}</StudyText>}
      </StudyPanel>
      {!!error && <StudyText>{error}</StudyText>}
      <StudyActionButton label="Luyện lại" secondary onPress={restart} />
    </StudyScreen>
  );
}

function metrics(score: number): readonly (readonly [string, number])[] {
  return [['Phát âm', Math.min(100, score + 2)], ['Ngữ điệu', Math.max(0, score - 2)], ['Tự nhiên', score]];
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fill: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center', gap: 5 },
});
