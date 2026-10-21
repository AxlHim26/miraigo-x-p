import type { ExploreItem } from '@/features/explore/types/explore';

export const exploreItems: ExploreItem[] = [
  { id: 'courses', title: 'Courses', description: 'Follow structured lessons from beginner to advanced.', category: 'learn', accent: '#208AEF' },
  { id: 'grammar', title: 'Grammar', description: 'Understand patterns with clear examples and practice.', category: 'learn', accent: '#7C5CFC' },
  { id: 'practice', title: 'Practice', description: 'Build confidence with reading, listening, and speaking.', category: 'practice', accent: '#E7772E' },
  { id: 'jlpt', title: 'JLPT', description: 'Prepare with focused levels, quizzes, and mock exams.', category: 'practice', accent: '#D94F70' },
  { id: 'vocabulary', title: 'Vocabulary', description: 'Review words and grow your personal vocabulary library.', category: 'review', accent: '#219A73' },
  { id: 'kanji', title: 'Kanji', description: 'Explore meanings, readings, radicals, and stroke order.', category: 'review', accent: '#B15A9A' },
];
