import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { StudyActionButton, StudyIconButton, StudyPanel, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { explainReadingWord } from '@/features/practice/services/study-tools-service';
import { readingArticleHref } from '@/features/reading/components/reading-browser';
import { ArticleUnavailable, readingIcons } from '@/features/reading/components/reading-ui';
import { articleById, wordKey } from '@/features/reading/data/reading-progress';
import type { ReadingArticle, ReadingWord } from '@/features/reading/data/reading-schema';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

export function ReadingVocabularyScreen() {
  const { articleId } = useLocalSearchParams<{ articleId?: string }>();
  const study = useReadingProgress();
  const article = articleById(study.progress, articleId);
  if (!study.ready || !article) return <ArticleUnavailable study={study} />;
  return (
    <StudyScreen title="Từ vựng trong bài" largeTitle back={readingArticleHref(article.id)}>
      <ReadingWords key={article.id} article={article} study={study} />
    </StudyScreen>
  );
}

function ReadingWords({ article, study }: { article: ReadingArticle; study: ReturnType<typeof useReadingProgress> }) {
  const colors = useStudyColors();
  const [searchOpen, setSearchOpen] = useState(!article.vocabulary?.length);
  const [input, setInput] = useState('');
  const dictionary = useMutation({ mutationFn: (word: string) => {
    const context = article.passageLines.find((line) => line.includes(word)) ?? article.passageLines[0];
    return explainReadingWord(word, context.slice(0, 400));
  } });
  const wordResult = dictionary.data && {
    term: dictionary.data.word, reading: dictionary.data.reading, meaningVi: dictionary.data.meaningVi,
  };
  const words = article.vocabulary ?? [];
  const speech = useStudySpeech([...words.map((word) => word.term), wordResult?.term ?? '']);

  const renderWord = (word: ReadingWord, index: number, example?: string) => {
    const active = speech.playing && speech.index === index;
    const saved = study.progress.savedWords.includes(wordKey(word));
    return (
      <StudyPanel key={wordKey(word)} style={styles.word}>
        <StudyIconButton size={37} icon={active ? readingIcons.pause : readingIcons.audio}
          label={active ? 'Dừng phát' : `Nghe từ ${word.term}`} onPress={active ? speech.stop : () => void speech.play(index)} />
        <View style={styles.copy}>
          <Text selectable style={[styles.term, { color: colors.title }]}>{word.term}</Text>
          <Text selectable style={[styles.reading, { color: colors.secondary }]}>{word.reading}</Text>
          <Text selectable style={[styles.meaning, { color: colors.text }]}>{word.meaningVi}</Text>
          {!!example && <Text selectable style={[styles.reading, { color: colors.secondary }]}>{example}</Text>}
        </View>
        <StudyIconButton size={39} icon={saved ? readingIcons.starFill : readingIcons.star} selected={saved}
          label={saved ? `Bỏ lưu từ ${word.term}` : `Lưu từ ${word.term}`} onPress={() => study.record({ type: 'word', word })} />
      </StudyPanel>
    );
  };
  return (
    <>
      <View style={styles.rows}>{words.map((word, index) => renderWord(word, index))}</View>
      {words.length > 0 && <StudyActionButton secondary icon={readingIcons.search}
        label={searchOpen ? 'Ẩn tra từ' : 'Tra từ khác trong bài'} onPress={() => setSearchOpen((open) => !open)} />}
      {searchOpen && (
        <StudyPanel>
          <StudyText heading>Tra từ theo ngữ cảnh</StudyText>
          <TextInput accessibilityLabel="Từ tiếng Nhật cần tra" placeholder="Nhập từ có trong bài"
            placeholderTextColor={colors.secondary} value={input} maxLength={30} autoCapitalize="none"
            editable={!dictionary.isPending} onChangeText={(text) => { dictionary.reset(); setInput(text); }}
            style={[styles.input, { color: colors.title, borderColor: colors.divider }]} />
          <StudyActionButton disabled={!input.trim() || dictionary.isPending}
            label={dictionary.isPending ? 'Đang tra từ…' : 'Giải nghĩa'} onPress={() => { speech.stop(); dictionary.mutate(input.trim()); }} />
          {dictionary.isError && <StudyText>Chưa tra được từ này. Hãy kiểm tra kết nối rồi thử lại.</StudyText>}
        </StudyPanel>
      )}
      {searchOpen && wordResult && renderWord(wordResult, words.length, `${dictionary.data.exampleJa}\n${dictionary.data.exampleVi}`)}
      {speech.failed && <StudyText>Thiết bị chưa phát được giọng tiếng Nhật.</StudyText>}
      {study.saveError && <StudyText>Chưa lưu được từ trên thiết bị.</StudyText>}
    </>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 6 },
  word: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 62, padding: 8 },
  copy: { flex: 1, minWidth: 0 },
  term: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  reading: { fontSize: 12, lineHeight: 17 },
  meaning: { fontSize: 13, lineHeight: 18 },
  input: { minHeight: 43, padding: 9, borderRadius: 12, borderWidth: 1, fontSize: 15 },
});
