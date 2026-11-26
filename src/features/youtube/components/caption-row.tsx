import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerControl, useLearnerPalette } from '@/components/ui/learner-glass';
import { pronunciationFeedback } from '@/features/practice/services/pronunciation-feedback';
import { useFurigana } from '@/features/youtube/hooks/use-youtube';
import { formatTime } from '@/features/youtube/utils/youtube';
import type { Analysis, CaptionLine, PronunciationResult } from '@/integrations/ai/ai-client';

function Furigana({ analysis }: { analysis: Analysis }) {
  const parts = analysis.tokens.flatMap((token) => token.furigana ?? [{ text: token.surface, reading: null }]);
  return (
    <View style={styles.furigana}>
      {parts.map((part, index) => (
        <View key={index} style={styles.part}>
          <ThemedText style={styles.reading} themeColor="textSecondary">
            {part.reading && part.reading !== part.text ? part.reading : ' '}
          </ThemedText>
          <ThemedText style={styles.base}>{part.text}</ThemedText>
        </View>
      ))}
    </View>
  );
}

type Props = {
  line: CaptionLine;
  index: number;
  active: boolean;
  selected: boolean;
  showFurigana: boolean;
  score?: PronunciationResult;
  isRecording: boolean;
  busy: boolean;
  message: string;
  onPlay: (index: number) => void;
  onRecord: (index: number) => void;
  onStop: () => void;
};

export const CaptionRow = memo(function CaptionRow({
  line, index, active, selected, showFurigana, score, isRecording, busy, message, onPlay, onRecord, onStop,
}: Props) {
  const palette = useLearnerPalette();
  const furigana = useFurigana(line.text, showFurigana);
  const feedback = score ? pronunciationFeedback(score) : [];

  return (
    <View style={[styles.row, {
      borderColor: selected ? palette.accentText : 'transparent',
      backgroundColor: active ? 'rgba(80,130,255,0.18)' : 'rgba(127,127,127,0.10)',
    }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Phát câu ${index + 1}`} onPress={() => onPlay(index)}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(line.start)}{score ? ` · ${Math.round(score.scores.overall)}/100` : ''}
        </ThemedText>
        {showFurigana && furigana.data
          ? <Furigana analysis={furigana.data} />
          : <ThemedText style={styles.base}>{line.text}</ThemedText>}
      </Pressable>
      {selected && (
        <View style={styles.practice}>
          <LearnerControl label="Nghe lại đoạn này" glyph="▶" disabled={isRecording || busy} onPress={() => onPlay(index)} />
          <LearnerControl
            label={isRecording ? 'Dừng ghi âm' : busy ? 'Đang chấm…' : 'Ghi âm đọc theo'}
            tone="accent"
            disabled={busy}
            onPress={() => (isRecording ? onStop() : onRecord(index))}
          />
          {!!message && <ThemedText accessibilityLiveRegion="polite">{message}</ThemedText>}
          {score && (
            <View accessibilityLiveRegion="polite" style={styles.result}>
              <ThemedText type="smallBold">Điểm phát âm: {Math.round(score.scores.overall)}/100</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Máy nghe được: {score.recognizedText || '—'}</ThemedText>
              {feedback.map((item, position) => (
                <ThemedText type="small" key={`${item.word}-${position}`}>
                  {item.word}: {item.notes.join(' ') || (item.missed ? 'Không nghe thấy.' : 'Đọc chưa chuẩn.')}
                </ThemedText>
              ))}
              {feedback.length === 0 && <ThemedText type="small">Không phát hiện lỗi.</ThemedText>}
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { borderWidth: 2, borderRadius: 14, padding: 12, gap: 8, marginBottom: 8 },
  furigana: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  part: { alignItems: 'center' },
  reading: { fontSize: 10, lineHeight: 14 },
  base: { fontSize: 19, lineHeight: 28 },
  practice: { gap: 8 },
  result: { gap: 4 },
});
