import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { LearnerLoadState } from '@/components/ui/learner-detail';
import { studySymbol } from '@/components/ui/study-icon';
import { StudyCover, StudyLinkRow, StudyShortcut } from '@/components/ui/study-navigation';
import { useLearnerProfile } from '@/features/auth/profile/use-learner-profile';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyScreen, StudyText } from '@/components/ui/study-screen';
import { GrammarQuiz } from '@/features/grammar/components/grammar-study-quiz';
import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';
import { grammarExercises } from '@/features/grammar/data/grammar-exercises';
import { useGrammarStudy } from '@/features/grammar/hooks/use-grammar-study';
import { studyWeek, useStudyTime } from '@/features/home/hooks/use-study-time';
import { getJlptQuestions, getPublishedExams, type JlptExam } from '@/features/practice/services/jlpt-service';
import { vocabularySessionHref } from '@/features/vocabulary/data/vocabulary-study';
import { useVocabularyCatalog, vocabularyLevels, type VocabularyLevel } from '@/features/vocabulary/hooks/use-vocabulary-data';
import { useDeviceBookmark } from '@/shared/hooks/use-device-bookmark';

const levels = [...vocabularyLevels];
const icons = {
  vocab: studySymbol('book', 'menu_book'),
  grammar: studySymbol('square.stack', 'layers'),
  jlpt: studySymbol('trophy', 'emoji_events'),
  calendar: studySymbol('calendar', 'calendar_month'),
  saved: studySymbol('bookmark', 'bookmark_border'),
  star: studySymbol('bookmark.fill', 'bookmark'),
  review: studySymbol('arrow.clockwise', 'refresh'),
  play: studySymbol('play.circle', 'play_circle'),
  reading: studySymbol('doc.text', 'description'),
  check: studySymbol('checkmark.circle', 'check_circle'),
  empty: studySymbol('circle', 'radio_button_unchecked'),
  wrong: studySymbol('xmark.circle', 'cancel'),
};

const kinds = [
  { id: 'vocab', label: 'Từ vựng', icon: icons.vocab },
  { id: 'grammar', label: 'Ngữ pháp', icon: icons.grammar },
  { id: 'jlpt', label: 'JLPT', icon: icons.jlpt },
] as const;
const catalog = (kind: string, level: VocabularyLevel) => ({ pathname: '/practice/catalog' as const, params: { kind, level } });
const drill = (level: VocabularyLevel, lesson?: string) => ({ pathname: '/practice/drill' as const, params: { level, ...(lesson ? { lesson } : {}) } });
const getLevel = (level?: string) => levels.find((item) => item === level) ?? levels[0];
const pointsAt = (level: VocabularyLevel) => grammarPoints.filter((item) => item.levelId === grammarLevels.find((entry) => entry.level === level)?.id);
const row = { flexDirection: 'row', gap: 8 } as const;

export function PracticeStudyHome() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const [selected, setLevel] = useState<VocabularyLevel>();
  const level = selected ?? profile.data.currentLevel;
  const { state, ready } = useGrammarStudy();
  const points = pointsAt(level);
  const completed = points.filter((point) => state.entries[point.id]?.lastGrade !== undefined).length;
  return (
    <StudyScreen title="Luyện tập" hint="日本語の練習" largeTitle>
      <StudyCover title={level} subtitle="Tiến độ luyện tập ngữ pháp"
        fraction={ready && points.length ? completed / points.length : undefined} onPress={() => router.push(drill(level))} />
      <StudyPills options={levels} current={level} onSelect={setLevel} />
      <View style={row}>
        {kinds.map(({ id, label, icon }) => <StudyShortcut key={id} label={label} icon={icon} onPress={() => router.push(catalog(id, level))} />)}
      </View>
      <StudyLinkRow title="AI Chat" subtitle="Nhắn tin và gọi thoại theo tình huống" icon={icons.reading} onPress={() => router.push('/practice/chat')} />
      <StudyLinkRow title="Luyện nói" subtitle="Shadowing, hội thoại và phát âm" icon={icons.play} onPress={() => router.push('/practice/speaking')} />
      <StudyLinkRow title="Ôn tập tổng hợp" subtitle="Từ vựng · Ngữ pháp · JLPT" icon={icons.review}
        onPress={() => router.push({ pathname: '/practice/review', params: { level } })} />
      <StudyLinkRow title="Lịch luyện tập" subtitle="Hoạt động học trong tuần" icon={icons.calendar} onPress={() => router.push('/practice/plan')} />
      <StudyLinkRow title="Đề yêu thích" subtitle="Các đề thi JLPT đã lưu" icon={icons.saved} onPress={() => router.push('/practice/saved')} />
    </StudyScreen>
  );
}

export function PracticeCatalog() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; level?: string }>();
  const kind = kinds.find((item) => item.id === params.kind) ?? kinds[0];
  const [level, setLevel] = useState(getLevel(params.level));
  return (
    <StudyScreen title={kind.label} back="/practice">
      <StudyPills options={levels} current={level} onSelect={setLevel} />
      {kind.id === 'vocab' ? <VocabularyTopics level={level} /> : kind.id === 'grammar' ? <GrammarTopics level={level} /> : (
        <>
          <StudyLinkRow title="Từ vựng (語彙)" subtitle="Kiến thức từ vựng, chữ Hán" icon={icons.vocab}
            onPress={() => router.push(jlptQuiz(level, 'LANGUAGE_KNOWLEDGE'))} />
          <StudyLinkRow title="Ngữ pháp (文法)" subtitle="Mẫu câu và cấu trúc" icon={icons.grammar}
            onPress={() => router.push(jlptQuiz(level, 'GRAMMAR_KNOWLEDGE'))} />
          <StudyLinkRow title="Đọc hiểu (読解)" subtitle="Đoạn văn và câu hỏi đọc hiểu" icon={icons.reading}
            onPress={() => router.push({ pathname: '/practice/reading-quiz', params: { level } })} />
          <StudyLinkRow title="Nghe hiểu (聴解)" icon={icons.play} onPress={() => router.push(jlptQuiz(level, 'LISTENING'))} />
          <StudyLinkRow title="Đề thi thử" icon={icons.jlpt}
            onPress={() => router.push({ pathname: '/practice/saved', params: { level, all: '1' } })} />
        </>
      )}
    </StudyScreen>
  );
}

function jlptQuiz(level: VocabularyLevel, type: string): Href {
  return { pathname: '/practice/jlpt/[level]/quiz', params: { level, type } };
}

function VocabularyTopics({ level }: { level: VocabularyLevel }) {
  const router = useRouter();
  const query = useVocabularyCatalog();
  const courses = query.data?.pages.flatMap((page) => page.courses).filter((course) => course.level?.toUpperCase() === level) ?? [];
  return (
    <>
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      <StudyLinkRow title="Tất cả" subtitle={courses.length ? level + ' · ' + courses.reduce((sum, course) => sum + course.totalWords, 0) + ' từ đã tải' : level}
        icon={icons.vocab} onPress={() => router.push(vocabularySessionHref('quiz', level))} />
      {courses.map((course) => <StudyLinkRow key={course.id} title={course.title} subtitle={course.totalWords + ' từ'} icon={icons.vocab}
        onPress={() => router.push(vocabularySessionHref('quiz', level, course.id))} />)}
      {query.hasNextPage && <StudyActionButton label={query.isFetchingNextPage ? 'Đang tải…' : 'Tải thêm chủ đề'}
        secondary disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
    </>
  );
}

function GrammarTopics({ level }: { level: VocabularyLevel }) {
  const router = useRouter();
  const points = pointsAt(level);
  const lessons = [...new Set(points.map((point) => point.lesson))];
  return (
    <>
      <StudyLinkRow title="Tất cả" subtitle={points.length + ' mẫu'} icon={icons.vocab} onPress={() => router.push(drill(level))} />
      {lessons.map((lesson) => {
        const group = points.filter((point) => point.lesson === lesson);
        return <StudyLinkRow key={lesson} title={'Bài ' + lesson} subtitle={group.length + ' mẫu · ' + group[0].title}
          icon={icons.grammar} onPress={() => router.push(drill(level, String(lesson)))} />;
      })}
    </>
  );
}

const statuses = ['Tất cả', 'Chưa làm', 'Đã làm', 'Đúng', 'Sai'] as const;
export function PracticeGrammarDrill() {
  const { level: rawLevel, lesson } = useLocalSearchParams<{ level?: string; lesson?: string }>();
  const level = getLevel(rawLevel);
  const router = useRouter();
  const study = useGrammarStudy();
  const [mode, setMode] = useState<'Luyện tập' | 'Ôn tập'>('Luyện tập');
  const [filter, setFilter] = useState<typeof statuses[number]>('Tất cả');
  const [quiz, setQuiz] = useState<ReturnType<typeof makeDeck>>();
  const [time] = useState(Date.now);
  const points = pointsAt(level).filter((point) => !lesson || String(point.lesson) === lesson);
  const lastGrade = (id: string) => study.state.entries[id]?.lastGrade;
  const selection = (status: typeof statuses[number]) => points.filter((point) => {
    if (mode === 'Ôn tập') {
      const due = study.state.entries[point.id]?.due;
      if (!due || due > time) return false;
    }
    const result = lastGrade(point.id);
    if (status === 'Chưa làm') return result === undefined;
    if (status === 'Đã làm') return result !== undefined;
    if (status === 'Đúng') return result === true;
    if (status === 'Sai') return result === false;
    return true;
  });
  const finished = points.filter((point) => lastGrade(point.id) !== undefined).length;
  const back = catalog('grammar', level);
  if (quiz) return <GrammarQuiz back={back} level={level} kind="choice" title="Luyện tập − Ngữ pháp"
    questions={quiz.map((item) => item.question)} pointIds={quiz.map((item) => item.id)} />;
  return (
    <StudyScreen title={`Ngữ pháp ${level}${lesson ? ' · Bài ' + lesson : ''}`} back={back}
      footer={<StudyActionButton icon={icons.play} label="Bắt đầu luyện tập" disabled={!study.ready || !selection(filter).length}
        onPress={() => {
          const points = selection(filter).sort((a, b) => Number(lastGrade(a.id) !== undefined) - Number(lastGrade(b.id) !== undefined));
          const deck = makeDeck(points);
          if (deck.length) setQuiz(deck);
        }} />}>
      <StudyPanel>
        <StudyText heading>Tiến độ</StudyText>
        <StudyText>{finished} / {points.length} mẫu</StudyText>
        <StudyProgressBar fraction={points.length ? finished / points.length : 0} />
      </StudyPanel>
      <StudyPills options={['Luyện tập', 'Ôn tập']} current={mode} onSelect={(value) => { setMode(value); setFilter('Tất cả'); }} />
      {statuses.map((status, index) => <StudyLinkRow key={status} title={status + ' (' + selection(status).length + ' mẫu)'}
        icon={[icons.play, icons.empty, icons.check, icons.check, icons.wrong][index]}
        end={filter === status ? <StudyText>✓</StudyText> : undefined} onPress={() => setFilter(status)} />)}
      {mode === 'Ôn tập' && !selection('Tất cả').length && <StudyText>Chưa có mẫu đến hạn ôn tập.</StudyText>}
      {study.readError && <StudyActionButton label="Tải lại tiến độ" secondary onPress={() => void study.retry()} />}
      <StudyActionButton label="Mở thư viện mẫu câu" secondary onPress={() => router.push('/grammar')} />
    </StudyScreen>
  );
}

function makeDeck(points: ReturnType<typeof pointsAt>) {
  return points.flatMap((point) => {
    const question = grammarExercises(point, 'choice')[0];
    return question ? [{ id: point.id, question }] : [];
  }).slice(0, 10);
}

export function PracticeReadingQuiz() {
  const { level: rawLevel } = useLocalSearchParams<{ level?: string }>();
  const level = getLevel(rawLevel);
  const back = catalog('jlpt', level);
  const query = useQuery({
    queryKey: ['jlpt', 'practice', level, 'READING'],
    queryFn: ({ signal }) => getJlptQuestions(level, 'READING', signal),
  });
  const deck = query.data?.flatMap((entry) => {
    const answerIndex = entry.options.findIndex((option) => option.key === entry.correctOptionKey);
    if (answerIndex < 0 || entry.options.length < 2) return [];
    return [{ passage: entry.passageText, question: { type: 'choice' as const, prompt: entry.prompt, answerIndex,
      choices: entry.options.map((option) => option.text), explanation: entry.explanation ?? '' } }];
  }) ?? [];
  if (deck.length) return <GrammarQuiz key={query.dataUpdatedAt} back={back} kind="choice" level={level} title="Luyện tập − Đọc hiểu"
    passages={deck.map((entry) => entry.passage)} questions={deck.map((entry) => entry.question)} />;
  return (
    <StudyScreen title="Luyện tập − Đọc hiểu" back={back}>
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.isSuccess && <StudyText>Chưa có câu hỏi đọc hiểu kèm đáp án cho {level}.</StudyText>}
    </StudyScreen>
  );
}

export function PracticeReview() {
  const router = useRouter();
  const { level: rawLevel } = useLocalSearchParams<{ level?: string }>();
  const level = getLevel(rawLevel);
  return (
    <StudyScreen title="Ôn tập tổng hợp" back="/practice">
      <StudyLinkRow title="Ôn từ vựng đến hạn" icon={icons.vocab} onPress={() => router.push(vocabularySessionHref('due', level))} />
      <StudyLinkRow title="Ôn mẫu ngữ pháp" icon={icons.grammar} onPress={() => router.push({ pathname: '/grammar/review', params: { level } })} />
      <StudyLinkRow title="Ôn đọc hiểu JLPT" icon={icons.reading} onPress={() => router.push({ pathname: '/practice/reading-quiz', params: { level } })} />
      <StudyLinkRow title="Lịch sử làm đề" icon={icons.jlpt} onPress={() => router.push('/practice/jlpt/history')} />
    </StudyScreen>
  );
}

export function PracticePlan() {
  const { days } = useStudyTime();
  const week = studyWeek(days, false);
  const { data: profile } = useLearnerProfile();
  return (
    <StudyScreen title="Lịch luyện tập" back="/practice">
      <StudyPanel><StudyText heading>Mục tiêu mỗi ngày</StudyText><StudyText>{profile.minutes} phút học</StudyText></StudyPanel>
      <StudyText heading>Hoạt động tuần này</StudyText>
      {week.map(({ label, seconds }) => <StudyPanel key={label}><StudyText heading>{label}</StudyText>
        <StudyText>{seconds ? Math.ceil(seconds / 60) + ' phút học' : 'Chưa ghi nhận hoạt động'}</StudyText></StudyPanel>)}
    </StudyScreen>
  );
}

export function PracticeSavedExams() {
  const { all, level } = useLocalSearchParams<{ all?: string; level?: string }>();
  const query = useQuery({ queryKey: ['jlpt', 'published-exams'], queryFn: getPublishedExams });
  const exams = query.data?.filter((exam) => !level || exam.level.toUpperCase() === level) ?? [];
  return (
    <StudyScreen title={all ? 'Đề thi thử JLPT ' + (level ?? '') : 'Đề yêu thích'} back="/practice">
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.isSuccess && !exams.length && <StudyText>Chưa có đề được công bố.</StudyText>}
      {query.isSuccess && !all && exams.length > 0 && <StudyText>Các đề đã đánh dấu trong thư viện đề thi.</StudyText>}
      {exams.map((exam) => <ExamRow key={exam.id} exam={exam} showAll={all === '1'} />)}
    </StudyScreen>
  );
}

function ExamRow({ exam, showAll }: { exam: JlptExam; showAll: boolean }) {
  const router = useRouter();
  const bookmark = useDeviceBookmark('jlpt.' + exam.id);
  if (!showAll && !bookmark.saved) return null;
  return (
    <View style={row}>
      <View style={{ flex: 1 }}><StudyLinkRow title={exam.title} subtitle={exam.level + ' · ' + exam.totalDurationMinutes + ' phút'} icon={icons.jlpt}
        onPress={() => router.push({ pathname: '/practice/jlpt/exam/[examId]', params: { examId: exam.id } })} /></View>
      <StudyIconButton icon={bookmark.saved ? icons.star : icons.saved} selected={bookmark.saved} disabled={!bookmark.enabled}
        label={bookmark.saved ? 'Bỏ lưu đề' : 'Lưu đề'} onPress={bookmark.toggle} />
    </View>
  );
}
