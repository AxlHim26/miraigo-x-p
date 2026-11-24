import { LearnerExternalAction } from '@/components/ui/learner-detail';
import type { LessonVideoProps } from '@/components/ui/lesson-video.types';

export function LessonVideo({ url, children }: LessonVideoProps) {
  return <>{children}<LearnerExternalAction label="Mở video bài học" url={url} /></>;
}

export function LessonPdf({ url }: { url: string }) {
  return <LearnerExternalAction label="Mở tài liệu PDF" url={url} />;
}
