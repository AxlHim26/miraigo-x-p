import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import { env } from '@/core/config/env';
import { demoPdf, demoVideo } from '@/integrations/demo/demo-data';

export function demoVideoSource(url: string) {
  return __DEV__ && env.demoMode && url === demoVideo ? require('@/assets/demo/lesson.mp4') as number : undefined;
}

export async function copyDemoMedia(url: string, file: File) {
  if (!__DEV__ || !env.demoMode) return false;
  const moduleId = url === demoPdf ? require('@/assets/demo/lesson.pdf') as number : demoVideoSource(url);
  if (moduleId === undefined) return false;
  const asset = await Asset.fromModule(moduleId).downloadAsync();
  if (!asset.localUri) throw new Error('Demo media is unavailable');
  new File(asset.localUri).copy(file);
  return true;
}
