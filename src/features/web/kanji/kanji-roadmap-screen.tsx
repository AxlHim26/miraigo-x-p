import Head from 'expo-router/head';

import { kanjiCatalog } from '@/features/kanji/data/catalog';
import {
  createRoadmapDays,
  deriveCurrentDay,
  kanjiRoadmapLevels,
  type KanjiRoadmapLevel,
} from '@/features/web/kanji/kanji-roadmap';
import KanjiRoadmapView from '@/features/web/kanji/kanji-roadmap-view';

function populateLevel(level: KanjiRoadmapLevel) {
  const characters = [...kanjiCatalog[level.level]]
    .sort((first, second) => first[4] - second[4] || first[0].localeCompare(second[0], 'ja'))
    .map(([glyph]) => glyph);
  const days = createRoadmapDays(level.id, level.level, characters);
  return {
    ...level,
    kanjiCount: characters.length,
    totalDays: days.length,
    currentDay: deriveCurrentDay(days.length, level.progress),
    days,
  };
}

const [firstLevel, ...moreLevels] = kanjiRoadmapLevels;
const roadmap: [KanjiRoadmapLevel, ...KanjiRoadmapLevel[]] = [
  populateLevel(firstLevel),
  ...moreLevels.map(populateLevel),
];

export default function KanjiRoadmapScreen() {
  return (
    <>
      <Head><title>Hán tự | Lộ trình</title></Head>
      <KanjiRoadmapView levels={roadmap} />
    </>
  );
}
