const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const isVideoId = (value: string) => VIDEO_ID.test(value);

export type TimedLine = { start: number; end: number };

/**
 * Index of the line being spoken at `time`: the last line that has started. Between two lines the earlier
 * one stays highlighted; before the first line the result is -1. `lines` must be sorted by start.
 */
export function activeLineIndex(lines: readonly TimedLine[], time: number): number {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (lines[middle].start <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

export const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** `2026-11-25T…` -> `25/11/2026` (the date as published, without time-zone conversion). */
export const formatDate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};
