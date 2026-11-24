import type { PropsWithChildren } from 'react';

import type { StudyColors } from '@/constants/study-colors';

export type LessonVideoProps = PropsWithChildren<{
  url: string;
  poster?: string | null;
  downloadKey?: string;
  resumeTime?: number;
  onTimeUpdate?: (seconds: number) => void;
  onPosition?: (seconds: number, duration: number) => void;
  onComplete?: () => void;
  colors: StudyColors;
}>;
