import { useMutation } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { annotateReadingLines } from '@/features/practice/services/study-tools-service';
import { ReadingResults } from '@/features/reading/components/reading-results';
import { ArticleUnavailable, JapaneseReadingText, ReadingBadge, ReadingRow, readingIcons } from '@/features/reading/components/reading-ui';
import { articleById, type ReadingAnswers } from '@/features/reading/data/reading-progress';
import type { ReadingArticle, ReadingOption, ReadingWord } from '@/features/reading/data/reading-schema';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

const root = '/practice/reading';

export function ReadingArticleScreen() {
  const { articleId } = useLocalSearchParams<{ articleId?: string }>();
  const study = useReadingProgress();
  const article = articleById(study.progress, articleId);
  if (!study.ready || !article) return <ArticleUnavailable study={study} />;
  return <LoadedArticle key={article.id} article={article} study={study} />;
}

function LoadedArticle({ article, study }: { article: ReadingArticle; study: ReturnType<typeof useReadingProgress> }) {
  const { record } = study;
  const entry = study.progress.entries[article.id];
  useFocusEffect(useCallback(() => { record({ type: 'open', article }); }, [article, record]));

  if (entry?.result && entry.draft === null) {
    return <ReadingResults article={article} answers={entry.result} retry={() => record({ type: 'retry', article })} saveError={study.saveError} />;
  }

  return (
    <ReadingExercise
      article={article}
      answers={entry?.draft ?? {}}
      saved={entry?.saved ?? false}
      save={() => record({ type: 'save', article })}
      choose={(question, option) => record({ type: 'answer', question, option, article })}
      submit={() => record({ type: 'submit', article })}
      saveError={study.saveError}
    />
  );
}

function ReadingExercise({ article, answers, saved, save, choose, submit, saveError }: {
  article: ReadingArticle;
  answers: ReadingAnswers;
  saved: boolean;
  save: () => void;
  choose: (question: string, option: ReadingOption) => void;
  submit: () => void;
  saveError: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(() => article.questions.find(({ id }) => !answers[id])?.id ?? article.questions[0].id);
  const [showTools, setShowTools] = useState(false);
  const words = article.vocabulary ?? [];
  const answered = article.questions.filter((item) => answers[item.id]).length;
  const count = article.questions.length;
  return (
    <StudyScreen title={article.source === 'ai' ? 'AI · Bài đọc mới' : article.title} back={root}
      action={<StudyIconButton icon={saved ? readingIcons.savedFill : readingIcons.saved} label={saved ? 'Bỏ lưu bài' : 'Lưu bài đọc'}
        selected={saved} onPress={save} />}
      footer={<StudyActionButton label={answered === count ? 'Nộp bài' : `Nộp bài · ${answered}/${count} câu`} disabled={answered !== count} onPress={submit} />}>
      <View style={styles.badges}>
        <ReadingBadge text={article.level} />
        <ReadingBadge text={`~ ${article.minutes} phút`} icon={readingIcons.clock} />
        <ReadingBadge text={`${count} câu hỏi`} icon={readingIcons.count} />
        {article.source === 'ai' && <ReadingBadge icon={readingIcons.sparkles} text="AI tạo" />}
      </View>
      {article.source === 'ai' && <StudyText heading>{article.title}</StudyText>}
      {article.source === 'ai' && <StudyText>{article.topic}</StudyText>}
      <Passage article={article} showTools={showTools} toggleTools={() => setShowTools((value) => !value)} />
      <WordShortcut article={article} />
      {article.questions.map((question, index) => (
        <QuestionPanel
          key={question.id}
          number={index + 1}
          count={count}
          question={question}
          words={words}
          expanded={expanded === question.id}
          selected={answers[question.id]}
          toggle={() => setExpanded((value) => value === question.id ? null : question.id)}
          choose={(option) => choose(question.id, option)}
        />
      ))}
      {saveError && <StudyText>Chưa lưu được tiến độ. Bạn vẫn có thể tiếp tục làm bài.</StudyText>}
    </StudyScreen>
  );
}

function Passage({ article, showTools, toggleTools }: { article: ReadingArticle; showTools: boolean; toggleTools: () => void }) {
  const colors = useStudyColors();
  const [translated, setTranslated] = useState(false);
  const speech = useStudySpeech(article.passageLines);
  const annotate = useMutation({ mutationFn: () => annotateReadingLines(article.passageLines) });
  return (
    <>
      <StudyPanel style={styles.passage}>
        {article.passageLines.map((line, index) => {
          const annotation = annotate.data?.[index];
          return (
            <View key={index} style={styles.line}>
              <JapaneseReadingText text={line} words={article.vocabulary ?? []} />
              {translated && annotation?.line === line && (
                <Text selectable style={[styles.annotation, { color: colors.secondary }]}>{annotation.romaji}{'\n'}{annotation.translation}</Text>
              )}
            </View>
          );
        })}
      </StudyPanel>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showTools }}
        onPress={toggleTools} style={styles.toolsToggle}>
        <StudyIcon name={readingIcons.audio} color={colors.icon} size={16} />
        <Text style={[styles.toolLabel, { color: colors.blue }]}>Nghe bài và bản dịch</Text>
        <StudyIcon name={showTools ? readingIcons.up : readingIcons.down} color={colors.icon} size={14} />
      </Pressable>
      {showTools && (
        <StudyPanel>
          <StudyActionButton secondary icon={speech.playing ? readingIcons.pause : readingIcons.play}
            label={speech.playing ? 'Dừng phát' : 'Nghe bài đọc'} onPress={speech.playing ? speech.stop : () => void speech.play(0, { through: true })} />
          <StudyActionButton secondary label={annotate.isPending ? 'Đang tải bản dịch…' : translated && annotate.data ? 'Ẩn bản dịch' : 'Hiện phiên âm và bản dịch'}
            disabled={annotate.isPending} onPress={() => {
              if (annotate.data) setTranslated((value) => !value);
              else annotate.mutate(undefined, { onSuccess: () => setTranslated(true) });
            }} />
          {speech.failed && <StudyText>Thiết bị chưa phát được giọng tiếng Nhật.</StudyText>}
          {annotate.isError && <StudyText>Chưa tải được bản dịch. Bạn có thể thử lại.</StudyText>}
        </StudyPanel>
      )}
    </>
  );
}

function WordShortcut({ article }: { article: ReadingArticle }) {
  const router = useRouter();
  const words = article.vocabulary?.length ?? 0;
  return (
    <ReadingRow title={words ? `Từ vựng (${words})` : 'Tra từ trong bài'} icon={readingIcons.book} trailing={readingIcons.down}
      onPress={() => router.push({ pathname: '/practice/reading/vocabulary', params: { articleId: article.id } })} />
  );
}

type Question = ReadingArticle['questions'][number];

function QuestionPanel({ number, count, question, words, expanded, selected, toggle, choose }: {
  number: number;
  count: number;
  question: Question;
  words: readonly ReadingWord[];
  expanded: boolean;
  selected?: ReadingOption;
  toggle: () => void;
  choose: (option: ReadingOption) => void;
}) {
  const colors = useStudyColors();
  return (
    <StudyPanel style={styles.question}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Câu hỏi ${number} trên ${count}${selected ? ', đã trả lời' : ''}`}
        accessibilityState={{ expanded }}
        onPress={toggle}
        style={({ pressed }) => [styles.questionHeader, { backgroundColor: expanded ? colors.iconFill : 'transparent', opacity: pressed ? 0.66 : 1 }]}>
        <Text style={[styles.questionTitle, { color: colors.title }]}>Câu hỏi ({number}/{count})</Text>
        {!!selected && <StudyIcon name={readingIcons.check} color={colors.icon} size={16} />}
        <StudyIcon name={expanded ? readingIcons.up : readingIcons.down} color={colors.icon} size={16} />
      </Pressable>
      {expanded && (
        <View style={styles.questionBody}>
          <JapaneseReadingText text={question.question} words={words} small />
          <View style={styles.choices}>
            {question.options.map(({ id, text }) => (
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected === id }} onPress={() => choose(id)} key={id}
                style={({ pressed }) => [styles.option, {
                  borderColor: id === selected ? colors.icon : colors.divider,
                  backgroundColor: id === selected ? colors.iconFill : colors.surface, opacity: pressed ? 0.75 : 1,
                }]}>
                <View style={[styles.radio, { borderColor: id === selected ? colors.icon : colors.secondary }]}>
                  {selected === id && <View style={[styles.radioDot, { backgroundColor: colors.icon }]} />}
                </View>
                <Text style={[styles.letter, { color: colors.title }]}>{id}.</Text>
                <View style={styles.optionText}><JapaneseReadingText text={text} words={words} small /></View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </StudyPanel>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  passage: { paddingHorizontal: 12, paddingVertical: 11, gap: 8 },
  line: { gap: 3 },
  annotation: { fontSize: 14, lineHeight: 21 },
  toolsToggle: { alignSelf: 'flex-start', minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 3 },
  toolLabel: { fontSize: 12, fontWeight: '600' },
  question: { padding: 4, gap: 0 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 5 },
  questionTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  questionBody: { paddingHorizontal: 5, paddingTop: 7, paddingBottom: 5, gap: 9 },
  choices: { gap: 5 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 39, paddingHorizontal: 7, paddingVertical: 4, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  optionText: { flex: 1, minWidth: 0 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.4, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  letter: { fontSize: 14, fontWeight: '700' },
});
