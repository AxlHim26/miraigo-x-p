import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import { learnerTabs, shouldHideLearnerTabs } from '@/constants/learner-navigation';

export default function LearnerNavigation() {
  const pathname = usePathname();

  return (
    <NativeTabs hidden={shouldHideLearnerTabs(pathname)} minimizeBehavior="automatic">
      {learnerTabs.map(({ name, label, icon }) => (
        <NativeTabs.Trigger key={name} name={name}>
          <NativeTabs.Trigger.Label>{label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={icon.ios} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
