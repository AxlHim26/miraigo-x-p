import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack, LearnerLoadState } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, LearnerSectionHeading, useLearnerPalette } from '@/components/ui/learner-glass';
import { dueVocabularyKey, getDueVocabulary, getVocabularyCourse, submitVocabularyReview, vocabularyProgressKey, type ReviewRating, type VocabularyEntry } from '@/features/vocabulary/services/vocabulary-service';
import { parseRouteId } from '@/shared/utils/route-id';
import { normalizeStudySearch } from '@/shared/utils/study-search';
import { useTheme } from '@/hooks/use-theme';

const ratings = [
  { label: 'Chưa nhớ', value: 0 },
  { label: 'Khó', value: 1 },
  { label: 'Nhớ được', value: 2 },
  { label: 'Dễ', value: 3 },
] as const;

export function VocabularyCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = parseRouteId(courseId);
  const query = useQuery({
    queryKey: ['vocabulary', 'course', id],
    queryFn: ({ signal }) => {
      if (!id) throw new Error('Invalid vocabulary course ID');
      return getVocabularyCourse(id, signal);
    },
    enabled: id !== null,
  });
  const course = query.data;

  return (
    <LearnerCanvas>
      <LearnerBack href="/vocabulary" label="Thư viện từ vựng" />
      <LearnerLoadState pending={query.isFetching && !course} error={query.error} missing={!id} retry={() => void query.refetch()} />
      {course && <>
        <LearnerHeading eyebrow={course.level} title={course.title} description={`${course.entries.length} từ vựng`} />
        <VocabularyEntries key={course.id} entries={course.entries} />
      </>}
    </LearnerCanvas>
  );
}

function VocabularyEntries({ entries }: { entries: VocabularyEntry[] }) {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);
  const [review, setReview] = useState(false);
  const palette = useLearnerPalette();
  const theme = useTheme();
  const term = normalizeStudySearch(search);
  const matches = term ? entries.filter((entry) => [entry.term, entry.reading, entry.meaning]
    .some((value) => value != null && normalizeStudySearch(value).includes(term))) : entries;

  if (review) return <ReviewSession entries={matches} onFinish={() => setReview(false)} />;
  if (!entries.length) return <LearnerPanel><ThemedText>Khóa học này chưa có từ vựng.</ThemedText></LearnerPanel>;

  return (
    <>
      <TextInput
        accessibilityLabel="Tìm từ trong khóa học"
        placeholder="Tìm theo từ, cách đọc hoặc nghĩa"
        placeholderTextColor={theme.textSecondary}
        value={search}
        onChangeText={(value) => { setSearch(value); setLimit(30); }}
        autoCapitalize="none"
        style={[styles.search, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }]}
      />
      {matches.length > 0 && <LearnerControl label={term ? 'Ôn các từ tìm được' : 'Học bằng thẻ từ'} tone="accent" onPress={() => setReview(true)} style={styles.action} />}
      <LearnerSectionHeading title="Danh sách từ" detail={<ThemedText type="small" themeColor="textSecondary">{matches.length} từ</ThemedText>} />
      {!matches.length && <LearnerPanel><ThemedText>Không có từ phù hợp.</ThemedText></LearnerPanel>}
      {matches.slice(0, limit).map((entry) => (
        <LearnerPanel key={entry.id}>
          <ThemedText type="smallBold" selectable>{entry.term}{entry.reading ? ` · ${entry.reading}` : ''}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" selectable>{entry.meaning}</ThemedText>
          {entry.example && <ThemedText type="small" selectable>{entry.example}</ThemedText>}
        </LearnerPanel>
      ))}
      {limit < matches.length && <LearnerControl label="Xem thêm từ" onPress={() => setLimit((value) => value + 30)} style={styles.action} />}
    </>
  );
}

export function VocabularyReviewScreen() {
  const query = useQuery({
    queryKey: dueVocabularyKey,
    queryFn: ({ signal }) => getDueVocabulary(signal),
    refetchOnWindowFocus: false,
  });

  return (
    <LearnerCanvas>
      <LearnerBack href="/vocabulary" label="Thư viện từ vựng" />
      <LearnerHeading title="Ôn từ đến hạn" description="Tự đánh giá mức độ ghi nhớ để hệ thống lên lịch ôn tiếp." />
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.data && <ReviewSession entries={query.data} due />}
    </LearnerCanvas>
  );
}

export function ReviewSession({ entries, due = false, onFinish }: {
  entries: VocabularyEntry[];
  due?: boolean;
  onFinish?: () => void;
}) {
  // Keep this batch stable even when updating the shared due list after each save.
  const [queue] = useState(entries);
  const [index, setIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const card = queue[index];
  const mutation = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: ReviewRating }) => submitVocabularyReview(id, rating),
    onSuccess: (_, { id }) => {
      queryClient.setQueryData<VocabularyEntry[]>(dueVocabularyKey, (current) => current?.filter((entry) => entry.id !== id));
      void queryClient.invalidateQueries({ queryKey: ['feature', '/vocabulary'] });
      void queryClient.invalidateQueries({ queryKey: ['vocabulary', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: vocabularyProgressKey });
      setAnswerVisible(false);
      setIndex((current) => current + 1);
    },
    onSettled: () => { submitting.current = false; },
  });

  if (!card) {
    return (
      <LearnerPanel>
        <ThemedText type="smallBold">{index ? `Đã lưu ${index} lượt ôn.` : due ? 'Chưa có từ nào đến hạn ôn.' : 'Không có thẻ từ.'}</ThemedText>
        {onFinish && <LearnerControl label="Về danh sách từ" onPress={onFinish} style={styles.action} />}
      </LearnerPanel>
    );
  }

  return (
    <LearnerPanel>
      <ThemedText type="small" themeColor="textSecondary">Thẻ {index + 1} / {queue.length}</ThemedText>
      <ThemedText accessibilityRole="header" style={styles.term} selectable>{card.term}</ThemedText>
      {answerVisible ? (
        <>
          {card.reading && <ThemedText selectable>{card.reading}</ThemedText>}
          <ThemedText type="smallBold" selectable>{card.meaning}</ThemedText>
          {card.example && <ThemedText type="small" themeColor="textSecondary" selectable>{card.example}</ThemedText>}
          {mutation.isError && <ThemedText type="small" accessibilityLiveRegion="polite">Chưa lưu được lượt ôn. Hãy thử chọn mức độ lại.</ThemedText>}
          <View style={styles.ratings}>
            {ratings.map(({ label, value }) => (
              <LearnerControl key={value} label={label} disabled={mutation.isPending} onPress={() => {
                if (submitting.current) return;
                submitting.current = true;
                mutation.mutate({ id: card.id, rating: value });
              }} />
            ))}
          </View>
        </>
      ) : (
        <LearnerControl label="Hiện đáp án" tone="accent" onPress={() => setAnswerVisible(true)} style={styles.action} />
      )}
      {onFinish && <LearnerControl label="Dừng ôn" disabled={mutation.isPending} onPress={onFinish} style={styles.action} />}
    </LearnerPanel>
  );
}

const styles = StyleSheet.create({
  action: { alignSelf: 'flex-start', maxWidth: '100%' },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  term: { fontSize: 32, lineHeight: 39, fontWeight: '800' },
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
});
