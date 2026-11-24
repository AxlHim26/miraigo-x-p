import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { JapaneseSpeech } from '@/components/ui/japanese-speech';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, useLearnerPalette } from '@/components/ui/learner-glass';
import { flashcardWords } from '@/features/practice/data/flashcard-data';
import { listeningQuestions } from '@/features/practice/data/listening-data';
import { useTheme } from '@/hooks/use-theme';

type ListeningMode = 'quiz' | 'dictation';
type ListeningLevel = 'Tất cả' | 'N5' | 'N4' | 'N3';
const levels: ListeningLevel[] = ['Tất cả', 'N5', 'N4', 'N3'];
const normalize = (text: string) => text.normalize('NFKC').replace(/[\p{White_Space}\p{Punctuation}]/gu, '');

export function ListeningScreen() {
  const [mode, setMode] = useState<ListeningMode>('quiz');
  const [level, setLevel] = useState<ListeningLevel>('Tất cả');
  return (
    <LearnerCanvas>
      <LearnerBack label="Luyện tập" href="/practice" />
      <LearnerHeading title="Luyện nghe" description="Nghe câu tiếng Nhật rồi chọn nghĩa hoặc gõ lại câu vừa nghe." />
      <View style={styles.row}>
        <LearnerControl label="Chọn nghĩa" selected={mode === 'quiz'} onPress={() => setMode('quiz')} />
        <LearnerControl label="Chép chính tả" selected={mode === 'dictation'} onPress={() => setMode('dictation')} />
      </View>
      <View style={styles.row}>
        {levels.map((item) => <LearnerControl key={item} label={item} selected={item === level} onPress={() => setLevel(item)} />)}
      </View>
      <ListeningSession key={`${mode}-${level}`} mode={mode} level={level} />
    </LearnerCanvas>
  );
}

function ListeningSession({ mode, level }: { mode: ListeningMode; level: ListeningLevel }) {
  const palette = useLearnerPalette();
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const questions = listeningQuestions.filter((item) => level === 'Tất cả' || item.level === level);
  const question = questions[index];

  if (!question) return (
    <LearnerPanel>
      <ThemedText type="smallBold">{score} / {questions.length} câu đúng</ThemedText>
      <LearnerControl label="Luyện lại" onPress={() => { setIndex(0); setScore(0); }} />
    </LearnerPanel>
  );

  const dictation = mode === 'dictation';
  const correct = dictation ? normalize(answer) === normalize(question.japanese) : answer === question.meaning;
  const choices = [...question.distractors];
  choices.splice(question.id % (choices.length + 1), 0, question.meaning);

  return (
    <LearnerPanel>
      <ThemedText type="smallBold">{question.level} · Câu {index + 1} / {questions.length}</ThemedText>
      <JapaneseSpeech text={question.speakText} />
      {dictation ? (
        <TextInput accessibilityLabel="Câu tiếng Nhật" value={answer} onChangeText={setAnswer} editable={!checked}
          maxLength={180} multiline autoCorrect={false} placeholder="Gõ lại câu vừa nghe"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: palette.text, borderColor: palette.border }]} />
      ) : choices.map((choice) => (
        <LearnerControl key={choice} label={choice} selected={answer === choice} disabled={checked} onPress={() => setAnswer(choice)} />
      ))}
      {checked ? (
        <>
          <ThemedText accessibilityLiveRegion="polite">{correct ? 'Chính xác!' : 'Xem lại câu mẫu.'}</ThemedText>
          <ThemedText selectable>{question.japanese}</ThemedText>
          <ThemedText>{question.meaning}</ThemedText>
          <LearnerControl label="Tiếp theo" tone="accent" onPress={() => {
            setIndex(index + 1); setAnswer(''); setChecked(false);
          }} />
        </>
      ) : (
        <LearnerControl label="Kiểm tra" tone="accent" disabled={!answer.trim()} onPress={() => {
          setChecked(true); if (correct) setScore(score + 1);
        }} />
      )}
    </LearnerPanel>
  );
}

export function PracticeFlashcardsScreen() {
  return (
    <LearnerCanvas>
      <LearnerBack label="Luyện tập" href="/practice" />
      <LearnerHeading title="Flashcard từ vựng" />
      <VocabularyFlashcards cards={flashcardWords} />
    </LearnerCanvas>
  );
}

type Flashcard = { japanese: string; reading: string; meaning: string; level?: string; example?: string; exampleMeaning?: string };

export function VocabularyFlashcards({ cards }: { cards: readonly Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const card = cards[index];

  function rate(remembered: boolean) {
    if (remembered) setKnown(known + 1);
    setRevealed(false);
    setIndex(index + 1);
  }

  return (
    <LearnerPanel>
      {card ? (
        <>
          <LearnerHeading eyebrow={`${card.level ? `${card.level} · ` : ''}Thẻ ${index + 1} / ${cards.length}`} title={card.japanese} />
          <JapaneseSpeech text={card.japanese} />
          {revealed ? (
            <>
              <ThemedText>{card.reading} · {card.meaning}</ThemedText>
              {!!card.example && <ThemedText selectable>{card.example}</ThemedText>}
              {!!card.exampleMeaning && <ThemedText themeColor="textSecondary">{card.exampleMeaning}</ThemedText>}
              <View style={styles.row}>
                <LearnerControl label="Cần ôn lại" onPress={() => rate(false)} />
                <LearnerControl label="Đã nhớ" tone="accent" onPress={() => rate(true)} />
              </View>
            </>
          ) : <LearnerControl label="Lật thẻ" tone="accent" onPress={() => setRevealed(true)} />}
        </>
      ) : (
        <>
          <ThemedText>Đã nhớ {known} / {cards.length} từ.</ThemedText>
          <LearnerControl label="Ôn lại" onPress={() => { setKnown(0); setIndex(0); }} />
        </>
      )}
    </LearnerPanel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 64, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 18 },
});
