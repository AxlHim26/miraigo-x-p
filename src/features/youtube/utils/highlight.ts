/**
 * Karaoke-style highlighting. YouTube captions only time whole lines, so the position inside a line is
 * estimated: each piece of text gets a share of the line's duration proportional to how long it takes to
 * say (its morae), and punctuation counts as a short pause.
 */

export type TextPart = { text: string; reading: string | null };

// Small kana join the previous mora (きゃ, ファ). っ, ん and ー take a beat of their own.
const SMALL_KANA = /[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ]/;
const KANA = /[ぁ-ゖァ-ヺー]/;
const KANJI = /[㐀-鿿々]/;
const PAUSE = /[、。！？!?,.…]/;
const SILENT = /[\s「」『』（）()【】・]/;

const KANJI_MORAE = 2; // used when the reading is unknown
const PAUSE_WEIGHT = 0.7;

export const countMorae = (reading: string) =>
  [...reading].filter((char) => KANA.test(char) && !SMALL_KANA.test(char)).length;

const weightOf = (char: string) => {
  if (SMALL_KANA.test(char) || SILENT.test(char)) return 0;
  if (PAUSE.test(char)) return PAUSE_WEIGHT;
  if (KANJI.test(char)) return KANJI_MORAE;
  return 1;
};

type Unit = { part: number; length: number; weight: number };

function units(parts: readonly TextPart[]): Unit[] {
  return parts.flatMap((part, index): Unit[] => {
    // A word with a reading (kanji with furigana) lights up as one piece.
    if (part.reading && part.reading !== part.text) {
      return [{ part: index, length: part.text.length, weight: Math.max(1, countMorae(part.reading)) }];
    }
    // Otherwise character by character; a small kana lights up together with the kana before it.
    const result: Unit[] = [];
    for (const char of part.text.split('')) {
      const previous = result.at(-1);
      if (previous && SMALL_KANA.test(char)) previous.length += 1;
      else result.push({ part: index, length: 1, weight: weightOf(char) });
    }
    return result;
  });
}

/**
 * How many characters of each part have been reached when `progress` (0 to 1) of the line has played.
 * A piece lights up as soon as it starts being said.
 */
export function highlightedLengths(parts: readonly TextPart[], progress: number): number[] {
  const lengths = parts.map(() => 0);
  if (!(progress > 0)) return lengths;
  if (progress >= 1) return parts.map((part) => part.text.length);

  const list = units(parts);
  const total = list.reduce((sum, unit) => sum + unit.weight, 0);
  const reached = progress * total;
  let before = 0;
  for (const unit of list) {
    if (before >= reached) break;
    lengths[unit.part] += unit.length;
    before += unit.weight;
  }
  return lengths;
}

// Compensates for the delay between the player reporting its position and the screen updating.
const LEAD_SECONDS = 0.15;
const STEPS = 50;

/** Fraction of a line already spoken at `time`, rounded so the screen only updates when it visibly moves. */
export function lineProgress(line: { start: number; end: number }, time: number): number {
  const duration = line.end - line.start;
  if (duration <= 0) return 1;
  const fraction = (time + LEAD_SECONDS - line.start) / duration;
  return Math.round(Math.max(0, Math.min(1, fraction)) * STEPS) / STEPS;
}
