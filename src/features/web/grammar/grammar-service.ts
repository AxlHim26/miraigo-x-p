import { grammarLevels, grammarPoints } from '@/features/grammar/data/catalog';

export async function getGrammarLevels() {
  return grammarLevels;
}

export async function getGrammarStats() {
  return {
    levelCount: grammarLevels.length,
    lessonCount: grammarLevels.reduce((total, level) => total + level.lessonCount, 0),
    grammarCount: grammarPoints.length,
  };
}

export async function getGrammarPoints(levelId?: string) {
  const level = levelId?.trim().toLowerCase();
  return level ? grammarPoints.filter((point) => point.levelId.toLowerCase() === level) : grammarPoints;
}
