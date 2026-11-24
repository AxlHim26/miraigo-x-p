import { LearnerExternalAction } from '@/components/ui/learner-detail';

export function CourseDownloadAction({ url, kind = 'video' }: { url: string; downloadKey?: string; kind?: 'video' | 'pdf' }) {
  return <LearnerExternalAction label={kind === 'pdf' ? 'Mở tài liệu' : 'Mở video'} url={url} />;
}
