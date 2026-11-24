import { FeatureScreen } from '@/features/learning/components/feature-screen';
import { featureRoutes } from '@/features/learning/data/feature-content';

export default function VocabularyScreen() {
  return <FeatureScreen config={featureRoutes['/vocabulary']} route="/vocabulary" />;
}
