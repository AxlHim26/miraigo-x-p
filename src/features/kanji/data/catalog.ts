import n1 from './n1.json';
import n2 from './n2.json';
import n3 from './n3.json';
import n4 from './n4.json';
import n5 from './n5.json';

export const kanjiLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type KanjiLevel = (typeof kanjiLevels)[number];
export type KanjiRow = [glyph: string, meaning: string, on: string, kun: string, strokes: number, radical: string, sinoVietnamese: string];

// Generated with scripts/export-kanji-catalog.mjs from miraigo-fe/data/kanji.
export const kanjiCatalog = { N5: n5, N4: n4, N3: n3, N2: n2, N1: n1 } as Record<KanjiLevel, KanjiRow[]>;
export const allKanji = kanjiLevels.flatMap((level) => kanjiCatalog[level].map((row) => ({ level, row })));
export const findKanji = (glyph: string) => allKanji.find((item) => item.row[0] === glyph);
