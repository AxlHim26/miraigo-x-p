import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LearnerLoadState } from '@/components/ui/learner-detail';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyProgressBar, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { VocabularyQuiz } from '@/features/vocabulary/components/vocabulary-quiz';
import { VocabularyInfo, VocabularyRow, VocabularyText, VocabularyWordCard, vocabularyIcons } from '@/features/vocabulary/components/vocabulary-ui';
import { vocabularySessionHref } from '@/features/vocabulary/data/vocabulary-study';
import { useVocabularyFavorites, useVocabularyProgress, useVocabularyWords, vocabularyLevels } from '@/features/vocabulary/hooks/use-vocabulary-data';
import {
  dueVocabularyKey, getDueVocabulary, submitVocabularyReview, vocabularyProgressKey, type ReviewRating, type VocabularyEntry,
} from '@/features/vocabulary/services/vocabulary-service';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';
import { parseRouteId } from '@/shared/utils/route-id';

type StudyWord = VocabularyEntry & { courseId?: number };

export function VocabularySession() {
  const { mode, level, courseId: requested, wordId: requestedWord } = useLocalSearchParams<{ mode?: string; level?: string; courseId?: string; wordId?: string }>();
  return <VocabularySessionContent key={`${mode}:${level}:${requested}:${requestedWord}`}
    mode={mode} level={level} requested={requested} requestedWord={requestedWord} />;
}

function VocabularySessionContent({ mode, level, requested, requestedWord }: {
  mode?: string;
  level?: string;
  requested?: string;
  requestedWord?: string;
}) {
  const router = useRouter();
  const [sessionWords, setSessionWords] = useState<StudyWord[] | null>(null);
  const courseId = parseRouteId(requested) ?? undefined;
  const wordId = parseRouteId(requestedWord);
  const dueMode = mode === 'due';
  const studyMode = mode === 'new';
  const quizMode = mode === 'quiz';
  const favoriteMode = mode === 'favorites';
  const weakMode = mode === 'weak';
  const knownMode = mode === 'known';
  const needsProgress = studyMode || weakMode || knownMode;
  const back: Href = courseId ? { pathname: '/vocabulary/[courseId]', params: { courseId } }
    : dueMode || favoriteMode || weakMode || knownMode ? '/vocabulary/review' : '/vocabulary';
  const title = quizMode ? 'Bài tập' : studyMode ? 'Học từ vựng' : dueMode ? 'Ôn tập' : 'Flashcard';
  const data = useVocabularyWords(vocabularyLevels.find((item) => item === level), courseId, !dueMode);
  const { progress, byId } = useVocabularyProgress();
  const favorite = useVocabularyFavorites(data.words, favoriteMode);
  const due = useQuery({
    queryKey: dueVocabularyKey,
    queryFn: ({ signal }) => getDueVocabulary(signal),
    enabled: dueMode,
  });
  const liked = new Set(favorite.data);
  const words = dueMode ? due.data ?? [] : data.words.filter((word) => {
    if (wordId) return word.id === wordId;
    if (studyMode) return !byId.has(word.id);
    if (favoriteMode) return liked.has(word.id);
    if (weakMode) return byId.get(word.id)?.repetitions === 0;
    if (knownMode) return byId.has(word.id);
    return true;
  });
  const pending = dueMode ? due.isPending : data.pending || (needsProgress && progress.isFetching) || (favoriteMode && favorite.isFetching);
  const error = dueMode ? due.error : data.error ?? (needsProgress ? progress.error : favoriteMode ? favorite.error : null);
  const ready = (!needsProgress || !!progress.data) && (!favoriteMode || !!favorite.data);
  const retry = () => {
    if (dueMode) void due.refetch();
    else {
      data.retry();
      if (needsProgress) void progress.refetch();
      if (favoriteMode) void favorite.refetch();
    }
  };

  if (sessionWords === null && !pending && !error && ready && words.length > 0) setSessionWords(words);

  if (sessionWords === null) {
    return (
      <StudyScreen title={title} largeTitle back={back}>
        <LearnerLoadState pending={pending} error={error} retry={retry} />
        {!pending && !error && (
          <StudyPanel><StudyText>{!ready ? 'Đăng nhập để tải tiến độ học từ vựng.'
            : dueMode ? 'Chưa có từ nào đến hạn ôn.' : 'Chưa có từ phù hợp để bắt đầu.'}</StudyText></StudyPanel>
        )}
        {studyMode && progress.isError && data.words.length > 0 && (
          <StudyActionButton secondary label="Mở flashcard"
            onPress={() => router.replace(vocabularySessionHref('flashcard', level, courseId))} />
        )}
        {!dueMode && !courseId && data.catalog.hasNextPage && <StudyActionButton secondary label="Tải thêm chủ đề"
          disabled={data.catalog.isFetchingNextPage} onPress={() => void data.catalog.fetchNextPage()} />}
      </StudyScreen>
    );
  }

  return quizMode ? <VocabularyQuiz words={sessionWords} back={back} />
    : <VocabularyDeck words={sessionWords} title={title} back={back} showMeaning={studyMode} />;
}

function VocabularyDeck({ words, title, back, showMeaning }: { words: StudyWord[]; title: string; back: Href; showMeaning: boolean }) {
  const router = useRouter();
  const [queue] = useState(() => words.slice(0, 20));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(showMeaning);
  const [showList, setShowList] = useState(false);
  const submitting = useRef(false);
  const speech = useStudySpeech(queue.flatMap((word) => [word.term, word.example ?? '']));
  const card = queue[index];
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: ReviewRating }) => submitVocabularyReview(id, rating),
    onSuccess: (_result, { id }) => {
      cache.setQueryData<VocabularyEntry[]>(dueVocabularyKey, (current) => current?.filter((word) => word.id !== id));
      void cache.invalidateQueries({ queryKey: ['vocabulary', 'stats'] });
      void cache.invalidateQueries({ queryKey: vocabularyProgressKey });
      void cache.invalidateQueries({ queryKey: ['feature', '/vocabulary'] });
      setIndex((step) => step + 1);
      setRevealed(showMeaning);
    },
    onSettled: () => { submitting.current = false; },
  });

  function rate(rating: ReviewRating) {
    if (!card || submitting.current) return;
    if (!revealed) { setRevealed(true); return; }
    submitting.current = true;
    speech.stop();
    save.mutate({ id: card.id, rating });
  }

  return (
    <StudyScreen title={card ? title : 'Hoàn thành'} largeTitle back={back}
      action={card && <StudyIconButton icon={vocabularyIcons.list} label={showList ? 'Ẩn danh sách từ' : 'Xem danh sách từ trong lượt'}
        selected={showList} onPress={() => setShowList((open) => !open)} />}>
      {card ? (
        <DeckCard
          index={index} total={queue.length} card={card} queue={showList ? queue : undefined} showMeaning={showMeaning} revealed={revealed}
          reveal={() => setRevealed((value) => !value)} rate={rate} saving={save.isPending} error={save.isError}
          speech={speech}
        />
      ) : (
        <>
          <StudyPanel><StudyText heading>Đã lưu {index} lượt học</StudyText><StudyText>Lịch ôn đã được cập nhật cho các từ vừa học.</StudyText></StudyPanel>
          <StudyActionButton tone="ink" label="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace(back)} />
        </>
      )}
    </StudyScreen>
  );
}

function DeckCard({ index, total, card, queue, showMeaning, revealed, reveal, rate, saving, error, speech }: {
  index: number;
  total: number;
  card: StudyWord;
  queue?: StudyWord[];
  showMeaning: boolean;
  revealed: boolean;
  reveal: () => void;
  rate: (rating: ReviewRating) => void;
  saving: boolean;
  error: boolean;
  speech: ReturnType<typeof useStudySpeech>;
}) {
  const router = useRouter();
  const colors = useStudyColors();
  const termPlaying = speech.playing && speech.index === index * 2;
  const examplePlaying = speech.playing && speech.index === index * 2 + 1;
  return (
    <>
      <View style={styles.progress}>
        <Text style={[styles.counter, { color: colors.secondary }]}>{index + 1} / {total}</Text>
        <StudyProgressBar fraction={index / total} style={styles.track} />
      </View>
      {!!queue && (
        <StudyPanel>
          <StudyText heading>Từ trong lượt học</StudyText>
          {queue.map((word, step) => word.courseId ? (
            <VocabularyRow key={word.id} title={word.term} subtitle={step === index ? 'Đang học' : undefined} icon={vocabularyIcons.book}
              onPress={() => router.push({ pathname: '/vocabulary/word/[wordId]', params: { wordId: word.id, courseId: word.courseId! } })} />
          ) : <StudyText key={word.id}>{step + 1}. {word.term}</StudyText>)}
        </StudyPanel>
      )}
      <VocabularyWordCard term={card.term} reading={showMeaning || revealed ? card.reading : null}
        play={termPlaying ? speech.stop : () => void speech.play(index * 2)} playing={termPlaying}>
        {!showMeaning && revealed && <Text style={[styles.meaning, { color: colors.title }]}>{card.meaning}</Text>}
      </VocabularyWordCard>
      {showMeaning && <VocabularyInfo title="Nghĩa" icon={vocabularyIcons.book}><VocabularyText>{card.meaning}</VocabularyText></VocabularyInfo>}
      {revealed && !!card.example && <VocabularyInfo title="Ví dụ" icon={vocabularyIcons.example}>
        <VocabularyText>{card.example}</VocabularyText>
        <StudyIconButton size={37} icon={examplePlaying ? vocabularyIcons.pause : vocabularyIcons.speaker}
          label={examplePlaying ? 'Dừng phát' : 'Nghe ví dụ'} onPress={examplePlaying ? speech.stop : () => void speech.play(index * 2 + 1)} />
      </VocabularyInfo>}
      <View style={styles.controls}>
        <StudyIconButton size={49} icon={vocabularyIcons.close} label={revealed ? 'Chưa nhớ' : 'Hiện nghĩa'}
          disabled={saving} onPress={() => rate(0)} />
        <StudyIconButton size={49} primary={showMeaning}
          icon={showMeaning ? termPlaying ? vocabularyIcons.pause : vocabularyIcons.play : vocabularyIcons.repeat}
          label={showMeaning ? termPlaying ? 'Dừng phát' : 'Nghe từ' : revealed ? 'Ôn lại sớm' : 'Hiện nghĩa'}
          disabled={saving} onPress={showMeaning ? termPlaying ? speech.stop : () => void speech.play(index * 2) : () => rate(1)} />
        <StudyIconButton size={49} icon={vocabularyIcons.check} label={revealed ? 'Đã nhớ' : 'Hiện nghĩa'}
          disabled={saving} onPress={() => rate(2)} />
      </View>
      {!showMeaning && <StudyActionButton secondary icon={vocabularyIcons.eye}
        label={revealed ? 'Ẩn nghĩa' : 'Hiện nghĩa'} disabled={saving} onPress={reveal} />}
      {saving && <StudyText>Đang lưu lượt học…</StudyText>}
      {error && <StudyText>Chưa lưu được lượt học. Hãy thử chọn lại.</StudyText>}
      {speech.failed && <StudyText>Thiết bị chưa phát được giọng tiếng Nhật.</StudyText>}
    </>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 27 },
  counter: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { flex: 1 },
  controls: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 7 },
  meaning: { marginTop: 10, fontSize: 17, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
});
