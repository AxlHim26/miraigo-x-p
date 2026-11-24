import { useFocusEffect } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { LearnerExternalAction } from '@/components/ui/learner-detail';
import { LearnerControl } from '@/components/ui/learner-glass';
import { VideoFrame } from '@/components/ui/lesson-video-controls';
import { LessonVideoPlayer } from '@/components/ui/lesson-video-player.native';
import { env } from '@/core/config/env';
import { copyDemoMedia } from '@/integrations/demo/demo-media.native';
import type { LessonVideoProps } from '@/components/ui/lesson-video.types';

const driveHosts = new Set(['drive.google.com', 'docs.google.com']);
const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);

function getDrivePreview(url: URL) {
  if (!driveHosts.has(url.hostname)) return null;
  const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id');
  return id && /^[\w-]+$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null;
}

function getYouTubeEmbed(url: URL) {
  const id = url.hostname === 'youtu.be'
    ? url.pathname.slice(1).split('/')[0]
    : youtubeHosts.has(url.hostname)
      ? url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]
      : null;
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
}

function MediaPreview({ uri, pdf = false }: { uri: string; pdf?: boolean }) {
  const [failed, setFailed] = useState(false);
  const allowedOrigin = new URL(uri).origin;
  if (failed) return <View style={styles.previewError}><ThemedText style={{ color: '#FFFFFF' }}>Không xem trước được nội dung này.</ThemedText></View>;
  return (
    <View style={pdf ? styles.document : styles.video}>
      <WebView
        source={{ uri }}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={({ url, isTopFrame }) => {
          try {
            return isTopFrame === false || new URL(url).origin === allowedOrigin;
          } catch {
            return false;
          }
        }}
        onError={() => setFailed(true)}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.url === uri) setFailed(true);
        }}
        startInLoadingState
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        mediaCapturePermissionGrantType="deny"
      />
    </View>
  );
}

export function LessonVideo(props: LessonVideoProps) {
  const parsed = new URL(props.url);
  const embed = getYouTubeEmbed(parsed) ?? getDrivePreview(parsed);
  return embed
    ? <HostedLessonVideo key={embed} uri={embed} {...props} />
    : <LessonVideoPlayer key={props.url} {...props} />;
}

function HostedLessonVideo({ uri, poster, colors, children }: LessonVideoProps & { uri: string }) {
  const [opened, setOpened] = useState(false);
  useFocusEffect(useCallback(() => () => { setOpened(false); }, []));
  const youtube = new URL(uri).hostname === 'www.youtube.com';
  const source = youtube ? `${uri}?playsinline=1&autoplay=1` : uri;
  return (
    <>
      <VideoFrame poster={poster} colors={colors} onPlay={opened ? undefined : () => setOpened(true)}>
        {opened && <MediaPreview uri={source} />}
      </VideoFrame>
      {children}
    </>
  );
}

export function LessonPdf({ url }: { url: string }) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const preview = getDrivePreview(new URL(url));
  const open = openFor === url;

  async function openPdf() {
    setFailed(false);
    setLoading(true);
    const file = new File(Paths.cache, `miraigo-lesson-${Date.now()}.pdf`);
    try {
      if (!await copyDemoMedia(url, file)) await File.downloadFileAsync(url, file, { idempotent: true });
      await file.preview({ title: 'Tài liệu bài học' });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {preview && <LearnerControl label={open ? 'Ẩn tài liệu PDF' : 'Xem tài liệu PDF'} onPress={() => setOpenFor(open ? null : url)} />}
      {preview && open && <MediaPreview key={preview} uri={preview} pdf />}
      {!preview && <LearnerControl label={loading ? 'Đang tải tài liệu…' : 'Xem tài liệu PDF'} disabled={loading} onPress={() => void openPdf()} />}
      {failed && <ThemedText accessibilityLiveRegion="polite">Không xem được PDF trên thiết bị này.{!env.demoMode && ' Bạn có thể mở tệp bằng trình duyệt.'}</ThemedText>}
      {!env.demoMode && <LearnerExternalAction label="Mở tệp PDF bằng trình duyệt" url={url} />}
    </>
  );
}

const styles = StyleSheet.create({
  video: { flex: 1, backgroundColor: '#000' },
  document: { height: 500, width: '100%' },
  previewError: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#102442' },
});
