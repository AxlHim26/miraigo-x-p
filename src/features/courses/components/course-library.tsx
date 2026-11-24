import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type PropsWithChildren } from 'react';
import { TextInput, View } from 'react-native';

import { useLearnerProfile } from '@/features/auth/profile/use-learner-profile';
import { getHttpUrl, LearnerLoadState } from '@/components/ui/learner-detail';
import { LessonPdf } from '@/components/ui/lesson-media';
import { studySymbol } from '@/components/ui/study-icon';
import { StudyCover, StudyLinkRow, StudyShortcut } from '@/components/ui/study-navigation';
import { StudyActionButton, StudyPanel, StudyPills, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { CourseDownloadAction } from '@/features/courses/components/course-download-action';
import { lessonIcons } from '@/features/courses/data/lesson-icons';
import { useCourseLearning } from '@/features/courses/hooks/use-course-learning';
import { useCourse } from '@/features/courses/hooks/use-course';
import { useResumeLesson } from '@/features/courses/hooks/use-resume-lesson';
import type { Course } from '@/features/courses/services/course-service';
import { chapterHref, courseCategories, courseHref, courseLevel, courseLevels, courseMediaHref, courseProgressHref, lessonHref, sectionMatches, type CourseCategory } from '@/features/courses/utils/course-navigation';
import { chaptersOf, orderedLessons } from '@/features/courses/utils/course-outline';
import { useHomeData } from '@/features/home/hooks/use-home-data';
import { useDeviceBookmark } from '@/shared/hooks/use-device-bookmark';
import { parseRouteId } from '@/shared/utils/route-id';
import { normalizeStudySearch } from '@/shared/utils/study-search';

const room = require('@/assets/images/lesson-room-cover.jpg') as number;
const icons = {
  chapter: studySymbol('folder', 'folder_open'),
  pdf: studySymbol('doc.text', 'description'),
  exercise: studySymbol('pencil', 'edit'),
  progress: studySymbol('chart.bar', 'bar_chart'),
  playlist: studySymbol('list.bullet', 'playlist_play'),
  check: studySymbol('checkmark.circle.fill', 'check_circle'),
};
const row = { flexDirection: 'row', gap: 8 } as const;
type Entry = ReturnType<typeof orderedLessons>[number];

export function CourseLibraryHome() {
  const router = useRouter();
  const query = useHomeData();
  const resume = useResumeLesson();
  const profile = useLearnerProfile();
  const [selected, select] = useState<typeof courseLevels[number]>();
  const courses = query.data ?? [];
  const recentCourse = courses.find((course) => course.id === resume?.courseId);
  const level = selected ?? (recentCourse && courseLevel(recentCourse)) ?? profile.data.currentLevel;
  const choices = courses.filter((course) => courseLevel(course) === level || (level === 'N5' && !courseLevel(course)));
  const active = choices.find((course) => course.id === resume?.courseId) ?? choices[0];
  return (
    <StudyScreen title="Khóa học" hint="日本語のコース" largeTitle>
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {active && <CourseHomeCard key={active.id} course={active} />}
      <StudyPills options={[...courseLevels]} current={level} onSelect={select} />
      {active && <CourseActions course={active} />}
      {query.isSuccess && !choices.length && <StudyText>Chưa có khóa học {level}.</StudyText>}
      {choices.filter((course) => course.id !== active?.id).map((course) => (
        <StudyLinkRow key={course.id} title={course.name} icon={icons.chapter} onPress={() => router.push(courseHref(course.id))} />
      ))}
      {active && <CourseContinue course={active} />}
    </StudyScreen>
  );
}

function CourseHomeCard({ course }: { course: Course }) {
  const router = useRouter();
  const learning = useCourseLearning(course.id);
  const entries = orderedLessons(course);
  const count = entries.filter(({ lesson }) => learning.completed.includes(lesson.id)).length;
  return <StudyCover title={courseLevel(course) ?? course.name} subtitle={learning.ready ? `Đã học ${count} / ${entries.length} bài` : course.name}
    fraction={learning.ready && entries.length ? count / entries.length : undefined} onPress={() => router.push(courseHref(course.id))} />;
}

function CourseActions({ course }: { course: Course }) {
  const router = useRouter();
  return (
    <View style={row}>
      <StudyShortcut label="Video bài học" icon={lessonIcons.play} onPress={() => router.push(courseMediaHref(course.id, 'video'))} />
      <StudyShortcut label="Tài liệu" icon={icons.pdf} onPress={() => router.push(courseMediaHref(course.id, 'pdf'))} />
      <StudyShortcut label="Bài tập" icon={icons.exercise} onPress={() => router.push({ pathname: '/practice/catalog', params: { level: courseLevel(course) ?? 'N5', kind: 'grammar' } })} />
      <StudyShortcut label="Đã lưu" icon={lessonIcons.bookmark} onPress={() => router.push(courseMediaHref(course.id, 'saved'))} />
    </View>
  );
}

function CourseContinue({ course }: { course: Course }) {
  const resume = useResumeLesson();
  const router = useRouter();
  const entries = orderedLessons(course);
  const current = (resume?.courseId === course.id ? entries.find(({ lesson }) => lesson.id === resume.lessonId) : undefined) ?? entries[0];
  return current ? (
    <>
      <StudyText heading>{resume?.courseId === course.id ? 'Tiếp tục học' : 'Bắt đầu học'}</StudyText>
      <CourseVideoRow course={course} entry={current} />
      <StudyLinkRow title="Danh sách phát" icon={icons.playlist} onPress={() => router.push(courseMediaHref(course.id, 'playlists'))} />
      <StudyLinkRow title="Tải xuống" icon={lessonIcons.download} onPress={() => router.push(courseMediaHref(course.id, 'downloads'))} />
      <StudyLinkRow title="Tiến độ khóa học" icon={icons.progress} onPress={() => router.push(courseProgressHref(course.id))} />
    </>
  ) : null;
}

function useCourseRoute() {
  const params = useLocalSearchParams<{ courseId?: string; chapterId?: string; category?: string; mode?: string; listId?: string; lessonId?: string }>();
  const courseId = parseRouteId(params.courseId);
  return { ...params, courseId, query: useCourse(courseId) };
}

function CourseUnavailable({ data, title }: { data: ReturnType<typeof useCourseRoute>; title: string }) {
  return (
    <StudyScreen title={title} back="/courses">
      <LearnerLoadState pending={data.query.isPending && !!data.courseId} missing={!data.courseId} error={data.query.error} retry={() => void data.query.refetch()} />
    </StudyScreen>
  );
}

export function CourseLibraryDetails() {
  const data = useCourseRoute();
  return data.query.data ? <CourseChapterList key={data.query.data.id} course={data.query.data} /> : <CourseUnavailable data={data} title="Khóa học" />;
}

function CourseChapterList({ course }: { course: Course }) {
  const router = useRouter();
  const [category, setCategory] = useState<CourseCategory>('Tất cả');
  const entries = orderedLessons(course).filter(({ section }) => sectionMatches(section.type, section.title, category));
  const chapters = chaptersOf(course).filter((chapter) => category === 'Tất cả' || entries.some((entry) => entry.chapter.id === chapter.id));
  return (
    <StudyScreen title={course.name} back="/courses">
      <CourseHomeCard course={course} />
      <StudyPills options={[...courseCategories]} current={category} onSelect={setCategory} />
      {chapters.map((chapter) => (
        <StudyLinkRow key={chapter.id} title={chapter.title} subtitle={entries.filter((entry) => entry.chapter.id === chapter.id).length + ' bài'}
          icon={icons.chapter} onPress={() => router.push(chapterHref(course.id, chapter.id, category))} />
      ))}
      {!chapters.length && <StudyText>Chưa có chương thuộc mục này.</StudyText>}
      <CourseActions course={course} />
    </StudyScreen>
  );
}

export function CourseLibraryChapter() {
  const data = useCourseRoute();
  const course = data.query.data;
  const chapter = course && chaptersOf(course).find((chapter) => chapter.id === parseRouteId(data.chapterId));
  const category = courseCategories.find((item) => data.category === item) ?? 'Tất cả';
  const learning = useCourseLearning(data.courseId ?? 0);
  if (!course) return <CourseUnavailable data={data} title="Chương học" />;
  const entries = orderedLessons(course).filter((entry) => entry.chapter.id === chapter?.id && sectionMatches(entry.section.type, entry.section.title, category));
  return (
    <StudyScreen title={chapter?.title ?? 'Chương học'} back={courseHref(course.id)}>
      <CourseCompletion course={course} entries={entries} />
      {chapter?.description && <StudyPanel><StudyText>{chapter.description}</StudyText></StudyPanel>}
      {entries.map((entry) => <CourseVideoRow key={entry.lesson.id} course={course} entry={entry} completed={learning.completed.includes(entry.lesson.id)} />)}
      {!entries.length && <StudyText>Chưa có bài học trong mục này.</StudyText>}
    </StudyScreen>
  );
}

function CourseVideoRow({ course, entry, completed }: { course: Course; entry: Entry; completed?: boolean }) {
  const router = useRouter();
  const thumb = getHttpUrl(course.thumbnailUrl);
  const video = getHttpUrl(entry.lesson.videoUrl);
  return <StudyLinkRow title={entry.lesson.title} subtitle={entry.section.title} icon={video ? lessonIcons.play : icons.pdf}
    thumbnail={video ? (thumb ? { uri: thumb } : room) : undefined}
    end={completed ? <StudyText>✓</StudyText> : undefined} onPress={() => router.push(lessonHref(course.id, entry.lesson.id))} />;
}

function CourseCompletion({ course, entries }: { course: Course; entries: Entry[] }) {
  const learning = useCourseLearning(course.id);
  const total = entries.length;
  const complete = entries.filter(({ lesson }) => learning.completed.includes(lesson.id)).length;
  const progress = total ? complete / total : 0;
  return (
    <StudyPanel>
      <View style={[row, { alignItems: 'center' }]}>
        <StudyRing progress={progress} size={70}><StudyText heading>{Math.round(progress * 100)}%</StudyText></StudyRing>
        <View style={{ flex: 1, gap: 6 }}>
          <StudyText heading>{courseLevel(course) ?? course.name}</StudyText>
          <StudyText>{learning.ready ? `Đã học ${complete} / ${total} bài` : 'Đang đọc tiến độ…'}</StudyText>
          <StudyProgressBar fraction={progress} />
        </View>
      </View>
      {learning.failed && <StudyText>Chưa đọc được tiến độ trên thiết bị.</StudyText>}
    </StudyPanel>
  );
}

export function CourseLibraryProgress() {
  const router = useRouter();
  const data = useCourseRoute();
  if (!data.query.data) return <CourseUnavailable data={data} title="Tiến độ khóa học" />;
  const course = data.query.data;
  const entries = orderedLessons(course);
  return (
    <StudyScreen title="Tiến độ khóa học" back={courseHref(course.id)}>
      <CourseCompletion course={course} entries={entries} />
      {chaptersOf(course).map((chapter) => (
        <StudyLinkRow key={chapter.id} title={chapter.title} icon={icons.chapter}
          subtitle={entries.filter((entry) => entry.chapter.id === chapter.id).length + ' bài'}
          onPress={() => router.push(chapterHref(course.id, chapter.id))} />
      ))}
    </StudyScreen>
  );
}

export function CourseLibraryMedia() {
  const data = useCourseRoute();
  return data.query.data ? <MediaLibrary key={data.query.data.id + ':' + data.mode + ':' + data.listId}
    course={data.query.data} mode={data.mode ?? 'video'} listId={data.listId} lessonId={parseRouteId(data.lessonId)} /> : <CourseUnavailable data={data} title="Thư viện bài học" />;
}

function MediaLibrary({ course, mode, listId, lessonId }: { course: Course; mode: string; listId?: string; lessonId: number | null }) {
  const router = useRouter();
  const [category, setCategory] = useState<CourseCategory>('Tất cả');
  const [search, setSearch] = useState('');
  const [downloadTab, setDownloadTab] = useState<'Video' | 'Tài liệu'>('Video');
  const learning = useCourseLearning(course.id);
  const list = learning.lists.find((item) => item.id === listId);
  const title = ({ video: 'Tất cả video', pdf: 'Tài liệu', saved: 'Đã lưu', downloads: 'Tải xuống', playlists: 'Danh sách phát' } as Record<string, string>)[mode] ?? list?.name ?? 'Danh sách phát';
  const entries = orderedLessons(course).filter(({ lesson, section }) => {
    if (mode === 'list' && !list?.lessons.includes(lesson.id)) return false;
    if (mode === 'pdf' || (mode === 'downloads' && downloadTab === 'Tài liệu')) return !!getHttpUrl(lesson.pdfUrl);
    if (mode === 'video' || mode === 'downloads') {
      return !!getHttpUrl(lesson.videoUrl) && sectionMatches(section.type, section.title, category)
        && normalizeStudySearch(lesson.title + ' ' + section.title).includes(normalizeStudySearch(search));
    }
    return true;
  });

  return (
    <StudyScreen title={title} back={mode === 'list' ? courseMediaHref(course.id, 'playlists') : courseHref(course.id)}>
      {mode === 'video' && (
        <>
          <CourseTextInput value={search} onChangeText={setSearch} placeholder="Tìm video" />
          <StudyPills options={[...courseCategories]} current={category} onSelect={setCategory} />
        </>
      )}
      {mode === 'downloads' && <StudyPills options={['Video', 'Tài liệu']} current={downloadTab} onSelect={setDownloadTab} />}
      {mode === 'playlists' ? (
        <>
          <CourseContinueCard course={course} />
          <StudyText heading>Danh sách của bạn</StudyText>
          <PlaylistForm ready={learning.ready} save={(name) => learning.createList(name, lessonId ?? undefined)} />
          {learning.lists.map((item) => lessonId ? (
            <StudyActionButton key={item.id} label={(item.lessons.includes(lessonId) ? '✓  ' : '+  ') + item.name}
              secondary disabled={!learning.ready} onPress={() => learning.toggleListItem(item.id, lessonId)} />
          ) : (
            <StudyLinkRow key={item.id} title={item.name} subtitle={item.lessons.length + ' bài'} icon={icons.playlist}
              onPress={() => router.push(courseMediaHref(course.id, 'list', item.id))} />
          ))}
        </>
      ) : entries.map((entry) => {
        const pdf = getHttpUrl(entry.lesson.pdfUrl);
        const video = getHttpUrl(entry.lesson.videoUrl);
        if (mode === 'saved') return <SavedLesson key={entry.lesson.id} course={course} entry={entry} />;
        if (pdf && (mode === 'pdf' || (mode === 'downloads' && downloadTab === 'Tài liệu'))) {
          return <StudyPanel key={entry.lesson.id}><StudyText heading>{entry.lesson.title}</StudyText><LessonPdf url={pdf} />
            {mode === 'downloads' && <CourseDownloadAction url={pdf} kind="pdf"
              downloadKey={learning.userId ? `${learning.userId}-${course.id}-${entry.lesson.id}` : undefined} />}
          </StudyPanel>;
        }
        if (mode === 'downloads' && video) {
          return <StudyPanel key={entry.lesson.id}><StudyText heading>{entry.lesson.title}</StudyText>
            <CourseDownloadAction url={video} downloadKey={learning.userId ? `${learning.userId}-${course.id}-${entry.lesson.id}` : undefined} />
          </StudyPanel>;
        }
        return <CourseVideoRow key={entry.lesson.id} course={course} entry={entry} completed={learning.completed.includes(entry.lesson.id)} />;
      })}
      {mode !== 'playlists' && !entries.length && <StudyText>Chưa có bài học phù hợp.</StudyText>}
      {mode === 'saved' && <StudyText>Bài đã lưu bằng nút dấu trang trong trình phát.</StudyText>}
      {learning.failed && <StudyText>Không cập nhật được dữ liệu trên thiết bị.</StudyText>}
    </StudyScreen>
  );
}

function CourseContinueCard({ course }: { course: Course }) {
  const router = useRouter();
  const resume = useResumeLesson();
  const current = resume?.courseId === course.id ? resume : undefined;
  if (!current) return null;
  return <StudyCover title="Tiếp tục học" subtitle={current.title} onPress={() => router.push(lessonHref(course.id, current.lessonId))} />;
}

function SavedLesson({ course, entry }: { course: Course; entry: Entry }) {
  const saved = useDeviceBookmark(`lesson.${course.id}.${entry.lesson.id}`);
  return saved.saved ? <CourseVideoRow course={course} entry={entry} /> : null;
}

function CourseTextInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const colors = useStudyColors();
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} accessibilityLabel={placeholder}
    placeholderTextColor={colors.secondary} style={{ backgroundColor: colors.surface, color: colors.text, padding: 12, borderRadius: 14 }} />;
}

export function PlaylistForm({ ready, save, children }: PropsWithChildren<{ ready: boolean; save: (name: string) => void }>) {
  const [name, setName] = useState('');
  return (
    <StudyPanel>
      {children}
      <CourseTextInput value={name} onChangeText={setName} placeholder="Tên danh sách phát" />
      <StudyActionButton label="Tạo danh sách phát" secondary disabled={!ready || !name.trim() || name.trim().length > 60}
        onPress={() => { save(name.trim()); setName(''); }} />
    </StudyPanel>
  );
}
