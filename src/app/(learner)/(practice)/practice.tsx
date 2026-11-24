import { FeatureScreen } from '@/features/learning/components/feature-screen';
import { featureRoutes } from '@/features/learning/data/feature-content';

export default function PracticeScreen() {
  return <FeatureScreen config={featureRoutes['/practice']} route="/practice" />;
}
