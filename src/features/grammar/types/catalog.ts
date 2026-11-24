export type GrammarLevel = {
  id: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  title: string;
  lessonCount: number;
  grammarCount: number;
  source: string;
};

export type GrammarPoint = {
  id: string;
  levelId: string;
  title: string;
  meaning: string;
  structure: string;
  lesson: number;
  examples: { japanese: string; reading?: string; vietnamese: string }[];
  notes?: string;
  tags?: string[];
};
