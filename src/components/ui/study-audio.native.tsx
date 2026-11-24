import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { LearnerExternalAction } from '@/components/ui/learner-detail';
import { demoVideoSource } from '@/integrations/demo/demo-media.native';
import { LearnerControl } from '@/components/ui/learner-glass';

export function StudyAudio({ url }: { url: string }) {
  return <AudioSource key={url} url={url} />;
}

function AudioSource({ url }: { url: string }) {
  const source = demoVideoSource(url) ?? url;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  useFocusEffect(useCallback(() => () => player.pause(), [player]));

  return (
    <>
      <LearnerControl
        label={status.playing ? 'Tạm dừng âm thanh' : 'Phát âm thanh'}
        glyph={status.playing ? undefined : '▶'}
        onPress={async () => {
          if (player.playing) {
            player.pause();
          } else {
            if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) await player.seekTo(0);
            player.play();
          }
        }}
      />
      {typeof source === 'string' && <LearnerExternalAction label="Mở tệp nghe bằng trình duyệt" url={url} />}
    </>
  );
}
