import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';

type PlaybackOptions = {
  rate?: number;
  through?: boolean;
  repeat?: () => boolean;
  onLineDone?: (index: number) => void;
};

export function useStudySpeech(lines: readonly string[], initial = 0) {
  const request = useRef(0);
  const [index, setIndex] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const [fraction, setFraction] = useState(0);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    request.current += 1;
    setPlaying(false);
    void Speech.stop().catch(() => undefined);
  }, []);

  useFocusEffect(useCallback(() => stop, [stop]));

  function select(next: number) {
    stop();
    setIndex(Math.max(0, Math.min(lines.length - 1, next)));
    setFraction(0);
  }

  async function play(start: number, options: PlaybackOptions = {}) {
    if (!lines[start]) return;
    const token = ++request.current;
    setFailed(false);
    setPlaying(true);
    const isCurrent = () => token === request.current;
    const fail = () => {
      if (!isCurrent()) return;
      setFailed(true);
      setPlaying(false);
    };

    function speakLine(next: number) {
      if (!isCurrent()) return;
      const text = lines[next];
      setIndex(next);
      setFraction(0);
      try {
        Speech.speak(text, {
          language: 'ja-JP',
          rate: options.rate ?? 1,
          useApplicationAudioSession: false,
          onBoundary: (event: { charIndex: number }) => {
            if (isCurrent()) setFraction(Math.max(0, Math.min(0.99, event.charIndex / text.length)));
          },
          onDone: () => {
            if (!isCurrent()) return;
            setFraction(1);
            options.onLineDone?.(next);
            if (options.through && next + 1 < lines.length) speakLine(next + 1);
            else if (options.through && options.repeat?.()) speakLine(0);
            else setPlaying(false);
          },
          onStopped: () => { if (isCurrent()) setPlaying(false); },
          onError: fail,
        });
      } catch {
        fail();
      }
    }

    try {
      await Speech.stop();
      if (isCurrent()) speakLine(start);
    } catch {
      fail();
    }
  }

  return { index, playing, fraction, failed, play, stop, select };
}
