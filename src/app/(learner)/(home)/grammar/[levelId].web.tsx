import { useLocalSearchParams } from 'expo-router';

import GrammarLevelDetail from '@/features/web/grammar/grammar-level-detail';

export default function WebGrammarLevel() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  return <GrammarLevelDetail levelId={levelId} />;
}
