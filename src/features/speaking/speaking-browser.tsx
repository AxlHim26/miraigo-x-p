import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { studySymbol } from '@/components/ui/study-icon';
import { StudyCover, StudyLinkRow, StudyShortcut } from '@/components/ui/study-navigation';
import { StudyPanel, StudyPills, StudyProgressBar, StudyScreen, StudyText } from '@/components/ui/study-screen';
import { useLearnerProfile } from '@/features/auth/profile/use-learner-profile';
import { freeSpeakingTopics, speakingLessons, speakingLevels, speakingTopics, type SpeakingLevel, type SpeakingLesson } from '@/features/speaking/lessons';
import { speakingScore, useSpeakingProgress } from '@/features/speaking/use-speaking-progress';

const room = require('@/assets/images/lesson-room-cover.jpg') as number;
const fuji = require('@/assets/images/listening-fuji.jpg') as number;
export const speakingIcons = {
  play: studySymbol('play.fill', 'play_arrow'), pause: studySymbol('pause.fill', 'pause'), mic: studySymbol('mic.fill', 'mic'),
  chat: studySymbol('bubble.left.and.bubble.right', 'forum'), ai: studySymbol('sparkles', 'auto_awesome'),
  role: studySymbol('person.2', 'groups'), calendar: studySymbol('calendar', 'calendar_month'), clock: studySymbol('clock', 'schedule'),
  chart: studySymbol('chart.bar', 'bar_chart'), word: studySymbol('book', 'menu_book'), settings: studySymbol('slider.horizontal.3', 'tune'),
  back: studySymbol('chevron.left', 'chevron_left'), next: studySymbol('chevron.right', 'chevron_right'), stop: studySymbol('stop.fill', 'stop'),
};

export function speakingLessonHref(lesson: SpeakingLesson, attemptId?: string) {
  return { pathname: '/practice/speaking/[lessonId]' as const, params: { lessonId: lesson.id, ...(attemptId ? { attemptId } : {}) } };
}
const row = { flexDirection: 'row', gap: 8 } as const;

export function SpeakingHome() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const level = speakingLevels.find((item) => item === profile.data.currentLevel) ?? 'N5';
  const { attempts, ready } = useSpeakingProgress();
  const latest = attempts[0];
  const library = { pathname: '/practice/speaking/library' as const, params: { level } };
  const current = speakingLessons.filter((lesson) => lesson.level === level);
  const practiced = new Set(attempts.map((attempt) => attempt.lessonId));
  const completed = current.filter((lesson) => practiced.has(lesson.id)).length;
  const recent = speakingLessons.find((lesson) => lesson.id === latest?.lessonId);
  return (
    <StudyScreen title="Luyện nói" hint={profile.data.displayName ? 'こんにちは、' + profile.data.displayName : 'こんにちは'} largeTitle>
      <StudyCover title={level} subtitle="Tiến độ luyện nói" fraction={(ready || !!latest) && current.length ? completed / current.length : undefined} onPress={() => router.push(library)} />
      {recent && latest && (
        <SpeakingRow lesson={recent} subtitle={`Kết quả gần nhất · ${speakingScore(latest)} điểm`}
          open={() => router.push(speakingLessonHref(recent, latest.id))} />
      )}
      <View style={row}>
        <StudyShortcut label="Shadowing" icon={speakingIcons.play} onPress={() => router.push(library)} />
        <StudyShortcut label="Hội thoại" icon={speakingIcons.chat} onPress={() => router.push('/practice/conversation')} />
        <StudyShortcut label="AI đối thoại" icon={speakingIcons.ai} onPress={() => router.push('/practice/ai-dialogue')} />
      </View>
      <View style={row}>
        <StudyShortcut label="Nhập vai" icon={speakingIcons.role} onPress={() => router.push({ ...library, params: { ...library.params, mode: 'Nhập vai' } })} />
        <StudyShortcut label="Phát âm" icon={speakingIcons.mic} onPress={() => router.push({ pathname: '/practice/voice/[mode]', params: { mode: 'pronunciation' } })} />
        <StudyShortcut label="Chủ đề tự do" icon={speakingIcons.word} onPress={() => router.push('/practice/speaking/free')} />
      </View>
      {Platform.OS !== 'web' && (
        <StudyLinkRow title="Shadowing YouTube" subtitle="Xem video, đọc theo từng câu phụ đề" icon={speakingIcons.play}
          onPress={() => router.push('/practice/youtube' as Href)} />
      )}
      <StudyLinkRow title="Lịch luyện nói" subtitle="Hoạt động học trong tuần" icon={speakingIcons.calendar} onPress={() => router.push('/practice/plan')} />
      <StudyLinkRow title="Tiến độ luyện nói" icon={speakingIcons.chart} onPress={() => router.push('/practice/speaking/stats')} />
    </StudyScreen>
  );
}

export function SpeakingLibrary() {
  const params = useLocalSearchParams<{ level?: string; mode?: string }>();
  const router = useRouter();
  const [level, setLevel] = useState<SpeakingLevel>(speakingLevels.find((level) => level === params.level) ?? 'N5');
  const [topic, setTopic] = useState<typeof speakingTopics[number]>('Tất cả');
  const lessons = speakingLessons.filter((lesson) => lesson.level === level && (topic === 'Tất cả' || lesson.category === topic));
  return (
    <StudyScreen title={params.mode === 'Nhập vai' ? 'Nhập vai' : 'Shadowing'} back="/practice/speaking">
      <StudyPills options={[...speakingLevels]} current={level} onSelect={setLevel} />
      <StudyPills options={[...speakingTopics]} current={topic} onSelect={setTopic} />
      {lessons.map((lesson) => <SpeakingRow key={lesson.id} lesson={lesson} open={() => {
        const destination = speakingLessonHref(lesson);
        router.push({ ...destination, params: { ...destination.params, mode: params.mode } });
      }} />)}
      {!lessons.length && <StudyPanel><StudyText>Chưa có bài luyện nói cho chủ đề này.</StudyText></StudyPanel>}
    </StudyScreen>
  );
}

function SpeakingRow({ lesson, subtitle, open }: { lesson: SpeakingLesson; subtitle?: string; open?: () => void }) {
  const router = useRouter();
  return <StudyLinkRow title={lesson.japaneseTitle} subtitle={subtitle ?? lesson.title}
    thumbnail={lesson.cover === 'room' ? room : fuji} icon={speakingIcons.play} onPress={open ?? (() => router.push(speakingLessonHref(lesson)))} />;
}

export function SpeakingStatistics() {
  const router = useRouter();
  const { attempts } = useSpeakingProgress();
  const [period, setPeriod] = useState('7 ngày');
  const [now] = useState(Date.now);
  const days = period === '7 ngày' ? 7 : period === '30 ngày' ? 30 : Infinity;
  const recent = attempts.filter((attempt) => now - Date.parse(attempt.createdAt) <= days * 86_400_000);
  const minutes = Math.floor(recent.reduce((sum, item) => sum + item.seconds, 0) / 60);
  const score = recent.length ? Math.round(recent.reduce((sum, item) => sum + speakingScore(item), 0) / recent.length) : 0;
  return (
    <StudyScreen title="Tiến độ luyện nói" back="/practice/speaking">
      <StudyPills options={['7 ngày', '30 ngày', 'Tất cả']} current={period} onSelect={setPeriod} />
      <View style={row}>
        {[['Bài đã luyện', recent.length], ['Thời gian', minutes + ' phút'], ['Điểm trung bình', score + '%']].map(([label, value]) => (
          <StudyPanel key={label} style={{ flex: 1 }}><StudyText heading>{value}</StudyText><StudyText>{label}</StudyText></StudyPanel>
        ))}
      </View>
      <StudyPanel><StudyText heading>Độ khớp lời nói</StudyText><StudyProgressBar fraction={score / 100} /></StudyPanel>
      <StudyText heading>Lịch sử luyện gần đây</StudyText>
      {recent.map((attempt) => {
        const lesson = speakingLessons.find((item) => item.id === attempt.lessonId);
        return lesson ? <SpeakingRow key={attempt.id} lesson={lesson} subtitle={attempt.mode + ' · ' + speakingScore(attempt) + ' điểm'}
          open={() => router.push(speakingLessonHref(lesson, attempt.id))} /> : null;
      })}
      {!recent.length && <StudyText>Hoàn thành một lượt luyện để xem tiến độ.</StudyText>}
    </StudyScreen>
  );
}

export function SpeakingFreeTopics() {
  const router = useRouter();
  return <StudyScreen title="Chủ đề tự do" back="/practice/speaking">
    {freeSpeakingTopics.map((topic) => (
      <StudyLinkRow key={topic.name} title={topic.name} subtitle={topic.prompt} icon={speakingIcons.mic}
        onPress={() => router.push({ pathname: '/practice/conversation', params: { topic: topic.name } })} />
    ))}
  </StudyScreen>;
}
