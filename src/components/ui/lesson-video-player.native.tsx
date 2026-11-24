import { useEvent, useEventListener } from 'expo';
import { useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer, type SubtitleTrack, type VideoPlayer } from 'expo-video';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LearnerExternalAction } from '@/components/ui/learner-detail';
import { VideoFrame } from '@/components/ui/lesson-video-controls';
import type { LessonVideoProps } from '@/components/ui/lesson-video.types';
import { StudyIcon } from '@/components/ui/study-icon';
import { useLessonDownload } from '@/components/ui/use-lesson-download.native';
import { LessonMenu } from '@/features/courses/components/lesson-menu';
import { demoVideoSource } from '@/integrations/demo/demo-media.native';
import { lessonIcons } from '@/features/courses/data/lesson-icons';

const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

// These properties are the Expo Video commands for a native player.
function seekTo(player: VideoPlayer, seconds: number) {
  player.currentTime = seconds;
}

function setRate(player: VideoPlayer, rate: number) {
  player.playbackRate = rate;
}

function setSubtitle(player: VideoPlayer, track: SubtitleTrack | null) {
  player.subtitleTrack = track;
}

function formatTime(seconds: number) {
  const time = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60) % 60;
  const tail = [minutes, time % 60].map((unit) => String(unit).padStart(2, '0')).join(':');
  return hours ? `${hours}:${tail}` : tail;
}

export function LessonVideoPlayer({ url, poster, downloadKey, resumeTime, onTimeUpdate, onPosition, onComplete, colors, children }: LessonVideoProps) {
  const source = demoVideoSource(url) ?? url;
  const player = useVideoPlayer(source, (instance) => { instance.timeUpdateEventInterval = 0.25; });
  const view = useRef<VideoView>(null);
  const lastSaved = useRef(resumeTime ?? 0);
  const didSeek = useRef(false);
  const [started, setStarted] = useState(false);
  const [menu, setMenu] = useState<'speed' | 'subtitles' | 'download' | null>(null);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: player.playbackRate });
  const { availableSubtitleTracks: tracks } = useEvent(player, 'availableSubtitleTracksChange', { availableSubtitleTracks: player.availableSubtitleTracks });
  const { subtitleTrack } = useEvent(player, 'subtitleTrackChange', { subtitleTrack: player.subtitleTrack });
  const download = useLessonDownload(url, downloadKey);
  const duration = Number.isFinite(player.duration) ? player.duration : 0;
  const failed = status === 'error';
  const loading = started && (status === 'loading' || status === 'idle');

  function savePosition(seconds: number) {
    if (!onPosition || !duration || !Number.isFinite(seconds) || seconds === lastSaved.current) return;
    lastSaved.current = seconds;
    onPosition(seconds, duration);
  }

  function resumePlayback(total: number) {
    if (didSeek.current || !total || !Number.isFinite(total)) return;
    didSeek.current = true;
    if (resumeTime && resumeTime < total - 1) seekTo(player, resumeTime);
  }

  useEventListener(player, 'statusChange', ({ status }) => {
    if (started && status === 'readyToPlay') resumePlayback(player.duration);
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (started) onTimeUpdate?.(currentTime);
    if (started && isPlaying && Math.abs(currentTime - lastSaved.current) >= 10) savePosition(Math.floor(currentTime));
  });
  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    if (!playing && started) savePosition(Math.floor(player.currentTime));
  });
  useEventListener(player, 'playToEnd', () => {
    savePosition(duration);
    onComplete?.();
  });
  useFocusEffect(useCallback(() => () => player.pause(), [player]));

  async function play() {
    if (failed) {
      try { await player.replaceAsync(source); } catch { return; }
    }
    resumePlayback(duration);
    if (duration > 0 && player.currentTime >= duration - 0.25) seekTo(player, 0);
    setStarted(true);
    player.play();
  }

  return (
    <>
      <VideoFrame
        colors={colors}
        poster={poster}
        label={failed ? 'Thử phát lại video' : undefined}
        onPlay={!started || failed ? () => void play() : undefined}
        overlay={!failed && (
          <View pointerEvents="box-none" style={styles.toolbar}>
            {duration > 0 && <VideoTimeline time={currentTime} duration={duration} seek={(seconds) => seekTo(player, seconds)} />}
            <View style={styles.toolbarRow}>
              <Text pointerEvents="none" style={styles.durationText}>{formatTime(!started && resumeTime && resumeTime < duration - 1 ? resumeTime : currentTime)}{duration > 0 ? ` / ${formatTime(duration)}` : ''}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Phụ đề" onPress={() => setMenu('subtitles')} style={styles.toolbarButton}>
                <StudyIcon name={lessonIcons.subtitles} color="#FFFFFF" size={18} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Tốc độ phát" onPress={() => setMenu('speed')} style={styles.toolbarButton}>
                <Text style={styles.durationText}>{playbackRate}×</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Xem toàn màn hình"
                onPress={() => void view.current?.enterFullscreen().catch(() => undefined)} style={styles.toolbarButton}>
                <StudyIcon name={lessonIcons.fullscreen} color="#FFFFFF" size={17} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Tải video" onPress={() => setMenu('download')} style={styles.toolbarButton}>
                <StudyIcon name={download.saved ? lessonIcons.check : lessonIcons.download} color="#FFFFFF" size={18} />
              </Pressable>
            </View>
          </View>
        )}>
        <VideoView
          ref={view}
          style={StyleSheet.absoluteFill}
          player={player}
          surfaceType="textureView"
          nativeControls={false}
          fullscreenOptions={{ enable: true }}
        />
        {started && !failed && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Tạm dừng video' : 'Phát video'}
              onPress={isPlaying ? () => player.pause() : () => void play()}
              style={styles.playbackOverlay}>
              {loading && <ActivityIndicator color="#FFFFFF" />}
              {!loading && !isPlaying && (
                <View style={styles.playOverlay}>
                  <StudyIcon name={lessonIcons.play} color="#FFFFFF" size={26} />
                </View>
              )}
            </Pressable>
          </>
        )}
      </VideoFrame>

      {children}

      {failed && (
        <>
          <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.secondary }]}>Không phát được video.{typeof source === 'string' && ' Bạn có thể thử lại hoặc mở bằng trình duyệt.'}</Text>
          {typeof source === 'string' && <LearnerExternalAction label="Mở video bằng trình duyệt" url={url} />}
        </>
      )}
      {download.failed && <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.secondary }]}>Không tải hoặc mở được tệp video. Vui lòng thử lại.</Text>}

      {menu === 'speed' && (
        <LessonMenu
          title="Tốc độ phát"
          items={rates.map((rate) => ({ label: `${rate}×`, selected: playbackRate === rate, onPress: () => setRate(player, rate) }))}
          colors={colors}
          close={() => setMenu(null)}
        />
      )}
      {menu === 'subtitles' && (
        <LessonMenu
          title="Phụ đề"
          message={!tracks.length ? status === 'readyToPlay' ? 'Video này chưa có phụ đề.' : 'Danh sách phụ đề có sau khi video tải xong.' : undefined}
          items={tracks.length ? [
            { label: 'Tắt phụ đề', selected: !subtitleTrack, onPress: () => setSubtitle(player, null) },
            ...tracks.map((track) => ({
              label: track.label || track.language,
              selected: subtitleTrack?.id === track.id,
              onPress: () => setSubtitle(player, track),
            })),
          ] : []}
          colors={colors}
          close={() => setMenu(null)}
        />
      )}
      {menu === 'download' && (
        <LessonMenu
          title="Tải video"
          message={download.busy ? 'Video đang được tải xuống.' : download.supported ? undefined
            : downloadKey ? 'Nguồn video này chưa cung cấp tệp để lưu trên thiết bị.' : 'Hãy đăng nhập để lưu video trên thiết bị.'}
          items={download.supported && !download.busy
            ? [{ label: download.saved ? 'Mở tệp đã tải' : 'Tải xuống', onPress: () => void download.downloadOrOpen() }] : []}
          colors={colors}
          close={() => setMenu(null)}
        />
      )}
    </>
  );
}

function VideoTimeline({ time, duration, seek }: {
  time: number;
  duration: number;
  seek: (seconds: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const clamp = (seconds: number) => Math.max(0, Math.min(duration, seconds));
  const position = clamp(drag ?? time);
  const offset = position / duration * 100;
  const seekPosition = (x: number) => width > 0 ? clamp(x / width * duration) : position;

  return (
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Vị trí phát video"
        accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(position), text: formatTime(position) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => seek(clamp(position + (event.nativeEvent.actionName === 'increment' ? 10 : -10)))}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => width > 0}
        onResponderGrant={(event) => setDrag(seekPosition(event.nativeEvent.locationX))}
        onResponderMove={(event) => setDrag(seekPosition(event.nativeEvent.locationX))}
        onResponderRelease={(event) => {
          seek(seekPosition(event.nativeEvent.locationX));
          setDrag(null);
        }}
        onResponderTerminate={() => setDrag(null)}
        style={styles.seek}>
        <View pointerEvents="none" style={styles.rail}>
          <View style={[styles.railFill, { width: `${offset}%` }]} />
          <View style={[styles.railThumb, { left: `${offset}%` }]} />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  feedback: { fontSize: 13, lineHeight: 18 },
  playbackOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playOverlay: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2027339C', alignItems: 'center', justifyContent: 'center' },
  toolbar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 4, backgroundImage: 'linear-gradient(180deg, transparent, rgba(18,19,23,0.86))' },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  toolbarButton: { minWidth: 37, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  durationText: { color: '#FFFFFF', marginRight: 'auto', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  seek: { flex: 1, height: 26, justifyContent: 'center', marginHorizontal: 6 },
  rail: { height: 4, borderRadius: 4, backgroundColor: '#FFFFFF66' },
  railFill: { height: 4, borderRadius: 10, backgroundColor: '#FFFFFF' },
  railThumb: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#FFFFFF', position: 'absolute', top: -3.5, marginLeft: -5.5 },
});
