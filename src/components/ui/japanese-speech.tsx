import * as Speech from 'expo-speech';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { LearnerControl } from '@/components/ui/learner-glass';

export function JapaneseSpeech({ text }: { text: string }) {
  return <JapaneseSpeechControls key={text} text={text} />;
}

function JapaneseSpeechControls({ text }: { text: string }) {
  const [failed, setFailed] = useState(false);
  useFocusEffect(useCallback(() => () => { void Speech.stop().catch(() => undefined); }, []));

  async function play(rate: number) {
    setFailed(false);
    try {
      await Speech.stop();
      Speech.speak(text, { language: 'ja-JP', rate, onError: () => setFailed(true) });
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <LearnerControl label="Nghe tiếng Nhật" glyph="▶" onPress={() => void play(1)} />
      <LearnerControl label="Nghe chậm" onPress={() => void play(0.7)} />
      {failed && <ThemedText accessibilityLiveRegion="polite">Không phát được giọng tiếng Nhật trên thiết bị này.</ThemedText>}
    </>
  );
}
