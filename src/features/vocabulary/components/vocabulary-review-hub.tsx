import { useRouter } from 'expo-router';
import { useState } from 'react';

import { LearnerLoadState } from '@/components/ui/learner-detail';
import { StudyPanel, StudyPills, StudyScreen, StudyText } from '@/components/ui/study-screen';
import { VocabularyRow, vocabularyIcons } from '@/features/vocabulary/components/vocabulary-ui';
import { vocabularySessionHref } from '@/features/vocabulary/data/vocabulary-study';
import { useVocabularyProgress, useVocabularyWords, vocabularyLevels } from '@/features/vocabulary/hooks/use-vocabulary-data';

const sections = ['Tất cả', 'Theo chủ đề', 'Lịch ôn'] as const;

export function VocabularyReviewHub() {
  return (
    <StudyScreen title="Ôn tập" largeTitle back="/vocabulary">
      <ReviewHubContent />
    </StudyScreen>
  );
}

function ReviewHubContent() {
  const router = useRouter();
  const [section, setSection] = useState<typeof sections[number]>('Tất cả');
  const { progress, stats } = useVocabularyProgress();
  const { courses } = useVocabularyWords(undefined, undefined, false);
  const level = vocabularyLevels.find((item) => courses.some((course) => course.level?.toUpperCase() === item));
  const due = stats.data?.dueForReview;
  const weak = progress.data?.filter((entry) => entry.repetitions === 0).length;
  const schedule = new Map<string, number>();
  for (const entry of progress.data ?? []) {
    const date = entry.nextReviewAt.slice(0, 10);
    if (date) schedule.set(date, (schedule.get(date) ?? 0) + 1);
  }

  return (
    <>
      <StudyPills options={sections} current={section} onSelect={setSection} />
      {section === 'Tất cả' && (
        <>
          <VocabularyRow title="Ôn tập hôm nay" subtitle={due === undefined ? 'Dựa trên lịch nhắc' : `${due} từ đến hạn`}
            icon={vocabularyIcons.repeat} onPress={() => router.push(vocabularySessionHref('due'))} />
          {level && <VocabularyRow title={`Ôn tập ${level}`} subtitle="Ôn các từ đã học" icon={vocabularyIcons.clock}
            onPress={() => router.push(vocabularySessionHref('known', level))} />}
          <VocabularyRow title="Từ yêu thích" icon={vocabularyIcons.star}
            onPress={() => router.push(vocabularySessionHref('favorites'))} />
          <VocabularyRow title="Từ chưa thuộc" subtitle={weak === undefined ? undefined : `${weak} từ`}
            icon={vocabularyIcons.warning} onPress={() => router.push(vocabularySessionHref('weak'))} />
        </>
      )}
      {section === 'Theo chủ đề' && courses.map((course) => (
        <VocabularyRow key={course.id} title={course.title} subtitle={`${course.totalWords} từ`} icon={vocabularyIcons.topic}
          onPress={() => router.push(vocabularySessionHref('known', course.level, course.id))} />
      ))}
      {section === 'Lịch ôn' && (
        <>
          <LearnerLoadState pending={progress.isFetching} error={progress.error} retry={() => void progress.refetch()} />
          {progress.isSuccess && !schedule.size && <StudyPanel><StudyText>Chưa có lịch ôn từ vựng.</StudyText></StudyPanel>}
          {Array.from(schedule.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(0, 12).map(([date, count]) => {
            const [year, month, day] = date.split('-');
            return <StudyPanel key={date}><StudyText heading>{day}/{month}/{year}</StudyText><StudyText>{count} từ được lên lịch</StudyText></StudyPanel>;
          })}
        </>
      )}
    </>
  );
}
