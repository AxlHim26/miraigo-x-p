const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);

export const isVideoId = (value: string) => VIDEO_ID.test(value);

/** Accepts a YouTube link (watch, youtu.be, shorts, embed, live) or a bare 11-character id. */
export function parseVideoId(input: string): string | null {
  const value = input.trim();
  if (isVideoId(value)) return value;

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);
    let id: string | null | undefined = null;
    if (host === 'youtu.be') id = segments[0];
    else if (HOSTS.has(host)) {
      id = segments[0] === 'watch' ? url.searchParams.get('v')
        : ['shorts', 'embed', 'live', 'v'].includes(segments[0] ?? '') ? segments[1] : null;
    }
    return id && isVideoId(id) ? id : null;
  } catch {
    return null;
  }
}

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
