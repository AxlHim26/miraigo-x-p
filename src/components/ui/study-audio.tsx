import { LearnerExternalAction } from '@/components/ui/learner-detail';

export function StudyAudio({ url }: { url: string }) {
  return <LearnerExternalAction label="Nghe âm thanh" url={url} />;
}
