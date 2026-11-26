import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerControl, useLearnerPalette } from '@/components/ui/learner-glass';
import { pronunciationFeedback } from '@/features/practice/services/pronunciation-feedback';
import { useFurigana } from '@/features/youtube/hooks/use-youtube';
import { highlightedLengths, type TextPart } from '@/features/youtube/utils/highlight';
import { formatTime } from '@/features/youtube/utils/youtube';
import type { Analysis, CaptionLine, PronunciationResult } from '@/integrations/ai/ai-client';

/** Text whose first `reached` characters are marked yellow. */
function Marked({ text, reached }: { text: string; reached: number }) {
  return (
    <ThemedText style={styles.base}>
      {reached > 0 && <ThemedText style={[styles.base, styles.spoken]}>{text.slice(0, reached)}</ThemedText>}
      {text.slice(reached)}
    </ThemedText>
  );
}

function Furigana({ parts, reached }: { parts: TextPart[]; reached: number[] }) {
  return (
    <View style={styles.furigana}>
      {parts.map((part, index) => (
        <View key={index} style={styles.part}>
          <ThemedText style={styles.reading} themeColor="textSecondary">
            {part.reading && part.reading !== part.text ? part.reading : ' '}
          </ThemedText>
          <Marked text={part.text} reached={reached[index] ?? 0} />
        </View>
      ))}
    </View>
  );
}

const toParts = (analysis: Analysis): TextPart[] =>
  analysis.tokens.flatMap((token) => token.furigana ?? [{ text: token.surface, reading: null }]);

type Props = {
  line: CaptionLine;
  index: number;
  active: boolean;
  /** Fraction of the line already spoken; only given to the line being played. */
  progress?: number;
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
  line, index, active, progress, selected, showFurigana, score, isRecording, busy, message, onPlay, onRecord, onStop,
}: Props) {
  const palette = useLearnerPalette();
  // The readings also tell how long each word takes to say, so the highlighted line needs them too.
  const analysis = useFurigana(line.text, showFurigana || active);
  const parts = analysis.data ? toParts(analysis.data) : [{ text: line.text, reading: null }];
  const reached = highlightedLengths(parts, progress ?? 0);
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
        {showFurigana && analysis.data
          ? <Furigana parts={parts} reached={reached} />
          : <Marked text={line.text} reached={reached.reduce((sum, length) => sum + length, 0)} />}
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
  spoken: { backgroundColor: '#FFD84D', color: '#1A1A1A' },
  practice: { gap: 8 },
  result: { gap: 4 },
});
