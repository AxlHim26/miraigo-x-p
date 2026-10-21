export type ExploreCategory = 'all' | 'learn' | 'practice' | 'review';

export type ExploreItem = {
  id: string;
  title: string;
  description: string;
  category: Exclude<ExploreCategory, 'all'>;
  accent: string;
};
