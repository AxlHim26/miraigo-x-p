import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

const roomPoster = require('@/assets/images/lesson-room-cover.jpg');

export function LessonPoster({ url }: { url?: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <Image
      accessible={false}
      source={url && failed !== url ? url : roomPoster}
      onError={() => { if (url) setFailed(url); }}
      placeholder={roomPoster}
      contentFit="cover"
      placeholderContentFit="cover"
      style={StyleSheet.absoluteFill}
    />
  );
}
