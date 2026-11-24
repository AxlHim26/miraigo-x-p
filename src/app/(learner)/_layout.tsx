import { LearnerAppShell } from '@/components/learner-app-shell';
import LearnerNavigation from '@/components/learner-navigation';

export const unstable_settings = { initialRouteName: '(home)' };

export default function LearnerLayout() {
  return (
    <LearnerAppShell>
      <LearnerNavigation />
    </LearnerAppShell>
  );
}
