import { Directory, File, Paths } from 'expo-file-system';
import { useRef, useState } from 'react';

import { env } from '@/core/config/env';
import { copyDemoMedia } from '@/integrations/demo/demo-media.native';

const videoExtensions = /\.(mp4|m4v|mov|webm)$/i;

function sourceHash(text: string) {
  return Array.from(text).reduce((hash, character) => Math.imul(hash ^ character.codePointAt(0)!, 16777619), 2166136261) >>> 0;
}

export function useLessonDownload(url: string, key?: string, kind: 'video' | 'pdf' = 'video') {
  const extension = new URL(url).pathname.match(kind === 'pdf' ? /\.pdf$/i : videoExtensions)?.[0].toLowerCase();
  const directory = new Directory(Paths.document, kind === 'pdf' ? 'miraigo-lesson-pdfs' : 'miraigo-lesson-videos');
  const name = key && extension ? `lesson-${key}-${sourceHash(env.apiBaseUrl + url)}` : null;
  const file = name ? new File(directory, `${name}${extension}`) : null;
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const active = useRef(false);
  const saved = status === 'saved' || (file?.exists ?? false);

  async function downloadOrOpen() {
    if (!file || !name || active.current) return;
    if (file.exists) {
      try {
        await file.preview();
      } catch {
        setStatus('error');
      }
      return;
    }
    active.current = true;
    setStatus('busy');
    const temporary = new File(directory, `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.part`);
    try {
      directory.create({ idempotent: true, intermediates: true });
      if (!await copyDemoMedia(url, temporary)) await File.downloadFileAsync(url, temporary);
      if (temporary.size <= 0) throw new Error('Empty download');
      if (!file.exists) temporary.move(file);
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      active.current = false;
      // A failed Android transfer may leave the partially written file behind.
      try {
        if (temporary.uri !== file.uri && temporary.exists) temporary.delete();
      } catch {
        // The destination remains usable even if cleanup fails.
      }
    }
  }

  return { supported: !!file, busy: status === 'busy', failed: status === 'error', saved, downloadOrOpen };
}
