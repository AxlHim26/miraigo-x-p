import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyPanel, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { readingArticleHref } from '@/features/reading/components/reading-browser';
import { ArticleUnavailable, JapaneseReadingText, ReadingRow, readingIcons } from '@/features/reading/components/reading-ui';
import { articleById, readingResult, type ReadingAnswers } from '@/features/reading/data/reading-progress';
import type { ReadingArticle } from '@/features/reading/data/reading-schema';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';

export function ReadingResults({ article, answers, retry, saveError }: { article: ReadingArticle; answers: ReadingAnswers; retry: () => void; saveError: boolean }) {
  return (
    <StudyScreen title="Kết quả" largeTitle back="/practice/reading">
      <ResultContent article={article} answers={answers} retry={retry} saveError={saveError} />
    </StudyScreen>
  );
}

function ResultContent({ article, answers, retry, saveError }: { article: ReadingArticle; answers: ReadingAnswers; retry: () => void; saveError: boolean }) {
  const colors = useStudyColors();
  const router = useRouter();
  const total = article.questions.length;
  const correct = readingResult(article, answers);
  return (
    <>
      <View style={styles.resultHero}>
        <View pointerEvents="none" style={[styles.resultWave, { backgroundColor: colors.iconFill }]} />
        <View pointerEvents="none" style={[styles.resultWaveTop, { backgroundColor: colors.wave }]} />
        <StudyRing progress={correct / total} size={154}>
          <Text style={[styles.score, { color: colors.title }]}>{correct} / {total}</Text>
          <Text style={[styles.accuracy, { color: colors.secondary }]}>Độ chính xác</Text>
          <Text style={[styles.resultPercent, { color: colors.title }]}>{Math.round(correct / total * 100)}%</Text>
        </StudyRing>
      </View>
      <View style={styles.totals}>
        <StudyPanel style={styles.totalCard}>
          <StudyIcon name={readingIcons.check} color={colors.green} size={23} />
          <View><StudyText>Câu đúng</StudyText><Text style={[styles.totalNumber, { color: colors.title }]}>{correct}</Text></View>
        </StudyPanel>
        <StudyPanel style={styles.totalCard}>
          <StudyIcon name={readingIcons.error} color="#D94F59" size={22} />
          <View><StudyText>Câu sai</StudyText><Text style={[styles.totalNumber, { color: colors.title }]}>{total - correct}</Text></View>
        </StudyPanel>
      </View>
      <ReadingRow title="Xem lại đáp án" icon={readingIcons.document} onPress={() => router.push({ pathname: '/practice/reading/answers', params: { articleId: article.id } })} />
      <ReadingRow title="Làm lại" icon={readingIcons.repeat} onPress={retry} />
      {saveError && <StudyText>Chưa lưu được kết quả trên thiết bị.</StudyText>}
    </>
  );
}

export function ReadingAnswersScreen() {
  const { articleId } = useLocalSearchParams<{ articleId?: string }>();
  const study = useReadingProgress();
  const article = articleById(study.progress, articleId);
  if (!study.ready || !article) return <ArticleUnavailable study={study} />;
  const answers = study.progress.entries[article.id]?.result;
  return (
    <StudyScreen title="Xem lại đáp án" largeTitle back={readingArticleHref(article.id)}>
      {answers ? <AnswerReview article={article} answers={answers} /> : <StudyPanel><StudyText>Hãy nộp bài để xem đáp án.</StudyText></StudyPanel>}
    </StudyScreen>
  );
}

function AnswerReview({ article, answers }: { article: ReadingArticle; answers: ReadingAnswers }) {
  const colors = useStudyColors();
  const [index, setIndex] = useState(() => Math.max(0, article.questions.findIndex((item) => answers[item.id] !== item.correctOptionId)));
  const item = article.questions[index];
  const selected = item.options.find(({ id }) => id === answers[item.id]);
  const correct = item.options.find(({ id }) => id === item.correctOptionId);
  const wrong = selected?.id !== correct?.id;
  const words = article.vocabulary ?? [];

  return (
    <>
      <View style={styles.answerTabs}>
        {article.questions.map((question, step) => {
          const active = step === index;
          const missed = answers[question.id] !== question.correctOptionId;
          return (
            <Pressable key={question.id} accessibilityRole="tab" accessibilityLabel={`Câu ${step + 1}, ${missed ? 'sai' : 'đúng'}`}
              accessibilityState={{ selected: active }} onPress={() => setIndex(step)}
              style={[styles.answerTab, { backgroundColor: active ? '#296FA8' : missed ? '#FFE5E7' : colors.iconFill }]}>
              <Text style={[styles.answerNumber, { color: active ? '#FFFFFF' : missed ? '#9D3039' : colors.blue }]}>{step + 1}</Text>
            </Pressable>
          );
        })}
      </View>
      <StudyPanel style={styles.answerPanel}>
        <View style={styles.resultLine}>
          <StudyIcon name={wrong ? readingIcons.error : readingIcons.check} color={wrong ? '#D94F59' : colors.green} size={22} />
          <StudyText heading>Câu hỏi {index + 1}</StudyText>
        </View>
        <JapaneseReadingText text={item.question} words={words} small />
        <View style={[styles.answerBox, { backgroundColor: wrong ? '#FFE5E7' : colors.iconFill }]}>
          <Text style={[styles.answerLabel, { color: wrong ? '#7B2D34' : colors.title }]}>Bạn chọn</Text>
          <Text selectable style={[styles.answerValue, { color: wrong ? '#7B2D34' : colors.title }]}>{selected ? `${selected.id}. ${selected.text}` : '—'}</Text>
        </View>
        <View style={[styles.answerBox, { backgroundColor: '#DEF4E7' }]}>
          <Text style={[styles.answerLabel, { color: '#19583D' }]}>Đáp án đúng</Text>
          <Text selectable style={[styles.answerValue, { color: '#19583D' }]}>{correct ? `${correct.id}. ${correct.text}` : '—'}</Text>
        </View>
        <View style={styles.resultLine}><StudyIcon name={readingIcons.info} color={colors.icon} size={18} /><StudyText heading>Giải thích</StudyText></View>
        <Text selectable style={[styles.annotation, { color: colors.text }]}>{item.explanationVi}</Text>
        <Text selectable style={[styles.annotation, { color: colors.secondary }]}>{item.explanationJa}</Text>
      </StudyPanel>
    </>
  );
}

const styles = StyleSheet.create({
  annotation: { fontSize: 14, lineHeight: 21 },
  resultHero: { minHeight: 210, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  resultWave: { position: 'absolute', left: '-25%', bottom: -61, width: '145%', height: 140, borderRadius: '50%', transform: [{ rotate: '-14deg' }] },
  resultWaveTop: { position: 'absolute', right: '-20%', bottom: -86, width: '116%', height: 139, borderRadius: '50%', opacity: 0.65, transform: [{ rotate: '-23deg' }] },
  score: { fontSize: 29, fontWeight: '800' },
  accuracy: { fontSize: 12, marginTop: 3 },
  resultPercent: { fontSize: 17, fontWeight: '700' },
  totals: { flexDirection: 'row', gap: 7 },
  totalCard: { flex: 1, flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 10 },
  totalNumber: { fontSize: 22, fontWeight: '800' },
  answerTabs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: 4 },
  answerTab: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  answerNumber: { fontSize: 15, fontWeight: '800' },
  answerPanel: { gap: 10 },
  resultLine: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  answerBox: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: 7, minHeight: 35, borderRadius: 10 },
  answerLabel: { minWidth: 81, fontSize: 12, fontWeight: '700' },
  answerValue: { flexShrink: 1, fontSize: 14, fontWeight: '600' },
});
