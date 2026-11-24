import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LessonPoster } from '@/components/ui/lesson-poster';
import { StudyIcon } from '@/components/ui/study-icon';
import type { StudyColors } from '@/constants/study-colors';
import { lessonIcons } from '@/features/courses/data/lesson-icons';

export function VideoFrame({ children, poster, onPlay, label, colors, overlay }: PropsWithChildren<{
  poster?: string | null;
  onPlay?: () => void;
  label?: string;
  colors: StudyColors;
  overlay?: ReactNode;
}>) {
  return (
    <View style={[styles.frame, { borderColor: colors.border, backgroundColor: colors.iconFill }]}>
      {children}
      {onPlay && (
        <>
          <LessonPoster url={poster} />
          <Pressable accessibilityRole="button" accessibilityLabel={label ?? 'Phát video'} onPress={onPlay} style={styles.overlay}>
            <View style={styles.playButton}>
              <StudyIcon name={lessonIcons.play} color="#FFFFFF" size={28} />
            </View>
          </Pressable>
        </>
      )}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { aspectRatio: 1.94, width: '100%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2027339C' },
});
