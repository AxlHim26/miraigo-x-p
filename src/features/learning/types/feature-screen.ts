import type { Href } from 'expo-router';

export type FeatureRoute = '/courses' | '/practice' | '/vocabulary' | '/kanji' | '/grammar';

export type FeatureSection = {
  id?: number;
  title: string;
  description: string;
  meta: string;
  href?: Href;
};

export type FeatureScreenConfig = {
  eyebrow: string;
  description: string;
  sections: FeatureSection[];
};
