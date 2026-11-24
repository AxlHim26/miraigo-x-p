import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, useLearnerPalette } from '@/components/ui/learner-glass';

const kanaRows = [
  ['あ い う え お', 'ア イ ウ エ オ', 'a i u e o'],
  ['か き く け こ', 'カ キ ク ケ コ', 'ka ki ku ke ko'],
  ['さ し す せ そ', 'サ シ ス セ ソ', 'sa shi su se so'],
  ['た ち つ て と', 'タ チ ツ テ ト', 'ta chi tsu te to'],
  ['な に ぬ ね の', 'ナ ニ ヌ ネ ノ', 'na ni nu ne no'],
  ['は ひ ふ へ ほ', 'ハ ヒ フ ヘ ホ', 'ha hi fu he ho'],
  ['ま み む め も', 'マ ミ ム メ モ', 'ma mi mu me mo'],
  ['や - ゆ - よ', 'ヤ - ユ - ヨ', 'ya - yu - yo'],
  ['ら り る れ ろ', 'ラ リ ル レ ロ', 'ra ri ru re ro'],
  ['わ - - - を', 'ワ - - - ヲ', 'wa - - - wo'],
  ['ん - - - -', 'ン - - - -', 'n - - - -'],
].map(([hiragana, katakana, romaji]) => {
  const readings = romaji.split(' ');
  const katakanaLetters = katakana.split(' ');
  return hiragana.split(' ').map((letter, index) => ({
    Hiragana: letter,
    Katakana: katakanaLetters[index],
    romaji: readings[index],
  }));
});

const alphabets = ['Hiragana', 'Katakana'] as const;

export function KanaScreen() {
  const palette = useLearnerPalette();
  const [alphabet, setAlphabet] = useState<typeof alphabets[number]>('Hiragana');
  const [speechError, setSpeechError] = useState(false);
  useFocusEffect(useCallback(() => () => { void Speech.stop().catch(() => undefined); }, []));

  async function play(letter: string) {
    setSpeechError(false);
    try {
      await Speech.stop();
      Speech.speak(letter, { language: 'ja-JP', onError: () => setSpeechError(true) });
    } catch {
      setSpeechError(true);
    }
  }

  return (
    <LearnerCanvas>
      <LearnerBack href="/" label="Trang chủ" />
      <LearnerHeading title="Bảng chữ tiếng Nhật" description="Chạm vào từng chữ để nghe cách đọc." />
      <View style={styles.row}>
        {alphabets.map((item) => (
          <LearnerControl
            key={item}
            label={item}
            selected={alphabet === item}
            onPress={() => setAlphabet(item)}
          />
        ))}
      </View>
      {speechError && <ThemedText accessibilityLiveRegion="polite">Thiết bị chưa phát được giọng tiếng Nhật.</ThemedText>}
      <View style={styles.table}>
        {kanaRows.map((row) => (
          <View key={row[0].Hiragana} style={styles.row}>
            {row.map((item, column) => item.romaji === '-' ? (
              <View key={column} style={styles.cell} />
            ) : (
              <Pressable
                key={column}
                accessibilityRole="button"
                accessibilityLabel={`Nghe chữ ${item[alphabet]}, ${item.romaji}`}
                onPress={() => void play(item[alphabet])}
                style={({ pressed }) => [
                  styles.cell,
                  styles.letter,
                  { backgroundColor: pressed ? palette.selection : palette.surface, borderColor: palette.border },
                ]}>
                <ThemedText style={[styles.kana, { color: palette.accentText }]}>{item[alphabet]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.romaji}</ThemedText>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  table: { gap: 6, maxWidth: 560 },
  row: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, minWidth: 0 },
  letter: { minHeight: 62, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  kana: { fontSize: 24, lineHeight: 29, fontWeight: '700' },
});
