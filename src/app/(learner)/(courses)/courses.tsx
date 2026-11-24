import { FeatureScreen } from '@/features/learning/components/feature-screen';
import { featureRoutes } from '@/features/learning/data/feature-content';

export default function CoursesScreen() {
  return <FeatureScreen config={featureRoutes['/courses']} route="/courses" />;
}
