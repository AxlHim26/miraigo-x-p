import { StudyActionButton, StudyText } from '@/components/ui/study-screen';
import { useLessonDownload } from '@/components/ui/use-lesson-download.native';
import { lessonIcons } from '@/features/courses/data/lesson-icons';

export function CourseDownloadAction({ url, downloadKey, kind = 'video' }: { url: string; downloadKey?: string; kind?: 'video' | 'pdf' }) {
  const download = useLessonDownload(url, downloadKey, kind);
  const label = kind === 'pdf' ? 'PDF' : 'video';
  return download.supported ? (
    <>
      <StudyActionButton label={download.saved ? 'Mở ' + label + ' đã tải' : download.busy ? 'Đang tải…' : 'Tải ' + label}
        secondary disabled={download.busy} icon={lessonIcons.download} onPress={() => void download.downloadOrOpen()} />
      {download.failed && <StudyText>Không mở hoặc tải được video. Hãy thử lại.</StudyText>}
    </>
  ) : <StudyText>{downloadKey ? 'Nguồn này chưa cung cấp tệp tải trực tiếp.' : 'Đăng nhập để lưu tệp trên thiết bị.'}</StudyText>;
}
