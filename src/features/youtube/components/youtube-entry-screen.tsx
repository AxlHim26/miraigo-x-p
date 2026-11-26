import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerHeading } from '@/components/ui/learner-glass';

export function YouTubeEntryScreen() {
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="Luyện tập" />
      <LearnerHeading title="Shadowing YouTube" description="Tính năng này hiện chỉ có trên ứng dụng điện thoại." />
    </LearnerCanvas>
  );
}
