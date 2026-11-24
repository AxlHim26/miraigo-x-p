import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { LearnerLoadState } from '@/components/ui/learner-detail';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { VocabularyInfo, VocabularyText, vocabularyIcons } from '@/features/vocabulary/components/vocabulary-ui';
import { useVocabularyWords, type CatalogWord } from '@/features/vocabulary/hooks/use-vocabulary-data';
import { useDeviceBookmark } from '@/shared/hooks/use-device-bookmark';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';
import { parseRouteId } from '@/shared/utils/route-id';

export function VocabularyDetail() {
  const params = useLocalSearchParams<{ courseId?: string; wordId?: string }>();
  const courseId = parseRouteId(params.courseId);
  const wordId = parseRouteId(params.wordId);
  const data = useVocabularyWords(undefined, courseId ?? undefined, !!courseId && !!wordId);
  const word = data.words.find((item) => item.id === wordId);
  return <Detail word={word} pending={!!courseId && !!wordId && data.pending} error={data.error} retry={data.retry} />;
}

function Detail({ word, pending, error, retry }: { word?: CatalogWord; pending: boolean; error: unknown; retry: () => void }) {
  return word ? <WordContent key={word.id} word={word} /> : (
    <StudyScreen title="Chi tiết từ" back="/vocabulary">
      <LearnerLoadState pending={pending} error={error} missing={!pending && !error} retry={retry} />
    </StudyScreen>
  );
}

function WordContent({ word }: { word: CatalogWord }) {
  const router = useRouter();
  const bookmark = useDeviceBookmark(`word.${word.id}`);
  return (
    <StudyScreen title="Chi tiết từ" back={{ pathname: '/vocabulary/[courseId]', params: { courseId: word.courseId } }}
      action={<StudyIconButton icon={bookmark.saved ? vocabularyIcons.heartFill : vocabularyIcons.heart}
        label={bookmark.saved ? 'Bỏ yêu thích từ này' : 'Thêm từ vào yêu thích'} selected={bookmark.saved}
        disabled={!bookmark.enabled} onPress={bookmark.toggle} />}>
      <WordFields word={word} />
      {bookmark.failed && <StudyPanel><StudyText>Chưa lưu được từ yêu thích trên thiết bị.</StudyText></StudyPanel>}
      <StudyActionButton tone="ink" label="Học từ này" onPress={() => router.push({
        pathname: '/vocabulary/session', params: { mode: 'flashcard', courseId: word.courseId, wordId: word.id },
      })} />
    </StudyScreen>
  );
}

function WordFields({ word }: { word: CatalogWord }) {
  const colors = useStudyColors();
  const speech = useStudySpeech([word.term, word.example ?? '']);
  return (
    <>
      <View style={styles.heading}>
        <View style={styles.word}>
          <Text selectable style={[styles.term, { color: colors.title }]}>{word.term}</Text>
          {!!word.reading && <Text selectable style={[styles.reading, { color: colors.secondary }]}>{word.reading}</Text>}
          {!!word.level && <Text style={[styles.badge, { color: colors.blue, backgroundColor: colors.iconFill }]}>{word.level}</Text>}
        </View>
        <StudyIconButton
          label={speech.playing && speech.index === 0 ? 'Dừng phát' : 'Nghe từ'}
          icon={speech.playing && speech.index === 0 ? vocabularyIcons.pause : vocabularyIcons.speaker}
          onPress={speech.playing && speech.index === 0 ? speech.stop : () => void speech.play(0)}
        />
      </View>
      <VocabularyInfo title="Nghĩa" icon={vocabularyIcons.book}><VocabularyText>{word.meaning}</VocabularyText></VocabularyInfo>
      {!!word.example && (
        <VocabularyInfo title="Ví dụ" icon={vocabularyIcons.example}>
          <VocabularyText>{word.example}</VocabularyText>
          <StudyIconButton
            label={speech.playing && speech.index === 1 ? 'Dừng phát' : 'Nghe ví dụ'}
            icon={speech.playing && speech.index === 1 ? vocabularyIcons.pause : vocabularyIcons.speaker}
            onPress={speech.playing && speech.index === 1 ? speech.stop : () => void speech.play(1)} size={38}
          />
        </VocabularyInfo>
      )}
      {speech.failed && <StudyText>Thiết bị chưa phát được giọng tiếng Nhật.</StudyText>}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingVertical: 7, paddingHorizontal: 3 },
  word: { flex: 1, gap: 4 },
  term: { fontSize: 32, lineHeight: 42, fontWeight: '800' },
  reading: { fontSize: 16 },
  badge: { alignSelf: 'flex-start', borderRadius: 10, overflow: 'hidden', marginTop: 4, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: '700' },
});
