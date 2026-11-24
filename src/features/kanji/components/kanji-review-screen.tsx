import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { JapaneseSpeech } from '@/components/ui/japanese-speech';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel } from '@/components/ui/learner-glass';
import { kanjiCatalog, kanjiLevels, type KanjiLevel } from '@/features/kanji/data/catalog';

const cardsPerSession = 10;

export function KanjiReviewScreen() {
  const [level, setLevel] = useState<KanjiLevel>('N5');
  return (
    <LearnerCanvas>
      <LearnerBack label="Hán tự" href="/kanji" />
      <LearnerHeading title="Ôn Hán tự" description="Nhớ nghĩa và âm đọc trước khi lật thẻ." />
      <View style={styles.row}>
        {kanjiLevels.map((item) => <LearnerControl key={item} label={item} selected={level === item} onPress={() => setLevel(item)} />)}
      </View>
      <Review key={level} level={level} />
    </LearnerCanvas>
  );
}

function Review({ level }: { level: KanjiLevel }) {
  const [batch, setBatch] = useState(0);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const entries = kanjiCatalog[level];
  const start = batch * cardsPerSession;
  const cards = entries.slice(start, start + cardsPerSession);
  const card = cards[index];

  function rate(remembered: boolean) {
    if (remembered) setKnown((count) => count + 1);
    setIndex((value) => value + 1);
    setRevealed(false);
  }

  function restart(newBatch: number) {
    setBatch(newBatch);
    setIndex(0);
    setKnown(0);
    setRevealed(false);
  }

  return (
    <LearnerPanel>
      {card ? (
        <>
          <LearnerHeading eyebrow={`${level} · Chặng ${batch + 1} · Thẻ ${index + 1}/${cards.length}`} title={card[0]} />
          {revealed ? (
            <>
              <ThemedText>{card[1]}</ThemedText>
              {!!card[6] && <ThemedText>Hán Việt: {card[6]}</ThemedText>}
              {!!card[2] && <ThemedText>Âm On: {card[2]}</ThemedText>}
              {!!card[3] && <ThemedText>Âm Kun: {card[3]}</ThemedText>}
              <JapaneseSpeech text={card[0]} />
              <View style={styles.row}>
                <LearnerControl label="Cần ôn lại" onPress={() => rate(false)} />
                <LearnerControl label="Đã nhớ" tone="accent" onPress={() => rate(true)} />
              </View>
            </>
          ) : <LearnerControl label="Lật thẻ" tone="accent" onPress={() => setRevealed(true)} />}
        </>
      ) : (
        <>
          <ThemedText>Đã nhớ {known} / {cards.length} chữ.</ThemedText>
          <LearnerControl label="Ôn lại chặng này" onPress={() => restart(batch)} />
          {start + cards.length < entries.length && (
            <LearnerControl label="Ôn chặng tiếp theo" tone="accent" onPress={() => restart(batch + 1)} />
          )}
        </>
      )}
    </LearnerPanel>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
