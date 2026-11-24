const clean = (value: string) => Array.from(value.normalize('NFKC').replace(/[\p{White_Space}\p{Punctuation}]/gu, ''));

export function transcriptScore(reference: string, transcript: string) {
  const expected = clean(reference);
  const actual = clean(transcript).slice(0, 1000);
  let previous = actual.map((_, index) => index + 1);
  previous.unshift(0);
  for (let i = 0; i < expected.length; i++) {
    const row = [i + 1];
    for (let j = 0; j < actual.length; j++) {
      row.push(Math.min(previous[j + 1] + 1, row[j] + 1, previous[j] + Number(expected[i] !== actual[j])));
    }
    previous = row;
  }
  return Math.max(0, Math.round((1 - previous[actual.length] / Math.max(expected.length, 1)) * 100));
}
