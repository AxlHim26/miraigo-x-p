// Print a deterministic compact snapshot of the companion miraigo-fe JLPT data.
import { readFileSync, readdirSync } from 'node:fs';

const source = new URL('../../miraigo-fe/data/kanji/', import.meta.url);
const [level, firstArg = '0', countArg = '10000'] = process.argv.slice(2);
const first = Number(firstArg);
const count = Number(countArg);
if (!/^N[1-5]$/.test(level ?? '') || !Number.isSafeInteger(first) || !Number.isSafeInteger(count) || first < 0 || count < 1) {
  throw new Error('Usage: node scripts/export-kanji-catalog.mjs N5 [offset] [limit]');
}

const text = (value) => typeof value === 'string' ? value.trim() : '';
const localized = (value) => typeof value === 'string' ? text(value) : text(value?.vi ?? value?.vietnamese ?? value?.en ?? value?.english);
const list = (value) => Array.isArray(value) ? value.map(text).filter(Boolean).join('、') : text(value);
const rows = [];
for (const file of readdirSync(source)) {
  if (!file.endsWith('.json') || file === 'default.json' || file.startsWith('CDP-')) continue;
  const item = JSON.parse(readFileSync(new URL(encodeURIComponent(file), source), 'utf8'));
  const jisho = item.jishoData ?? {};
  const alive = item.kanjialiveData ?? {};
  if ((item.jlpt ?? jisho.jlptLevel) !== level) continue;
  const glyph = text(item.id ?? file.slice(0, -5));
  if (!glyph || [...glyph].length !== 1) continue;
  const meaning = localized(item.meaning) || localized(alive.meaning) || localized(jisho.meaning);
  rows.push([glyph, meaning, list(jisho.onyomi) || text(alive.onyomi_ja), list(jisho.kunyomi) || text(alive.kunyomi_ja),
    Number(jisho.strokeCount ?? alive.kstroke) || 0, text(jisho.radical?.symbol), list(item.hanViet) || text(item.amHanViet)]);
}
rows.sort((a, b) => a[4] - b[4] || a[0].localeCompare(b[0], 'ja'));
console.log(JSON.stringify(rows.slice(first, first + count)));
