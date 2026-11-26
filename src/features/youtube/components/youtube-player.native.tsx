import { useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { z } from 'zod';

import { isVideoId } from '@/features/youtube/utils/youtube';

// The page needs a real https origin, otherwise YouTube refuses to play (missing referrer).
const ORIGIN = 'https://miraigo.app';
const ALLOWED = /^(about:blank|https:\/\/(miraigo\.app|([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com|google\.com|googlevideo\.com|ytimg\.com|doubleclick\.net|gstatic\.com))(\/|$))/i;

const message = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('time'), t: z.number() }),
  z.object({ type: z.literal('segmentEnd') }),
  z.object({ type: z.literal('state'), playing: z.boolean() }),
  z.object({ type: z.literal('error'), code: z.number() }),
]);

export type YouTubePlayerHandle = {
  /** Play from `start` and pause automatically at `end` (seconds). */
  playSegment: (start: number, end: number) => void;
  pause: () => void;
};

type Props = {
  ref?: Ref<YouTubePlayerHandle>;
  videoId: string;
  onTime: (seconds: number) => void;
  /** The segment started with `playSegment` has been played to its end. */
  onSegmentEnd: () => void;
  onPlayingChange: (playing: boolean) => void;
  onError: (code: number) => void;
};

/** Uses YouTube's official IFrame Player API inside a WebView. */
const page = (videoId: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body,#player{margin:0;padding:0;width:100%;height:100%;background:#000}</style></head>
<body><div id="player"></div><script>
var player = null, stopAt = null, heldAt = null;
function send(m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    videoId: '${videoId}',
    playerVars: { playsinline: 1, rel: 0, origin: '${ORIGIN}' },
    events: {
      onReady: function () { send({ type: 'ready' }); },
      onStateChange: function (e) { send({ type: 'state', playing: e.data === 1 }); },
      onError: function (e) { send({ type: 'error', code: e.data }); }
    }
  });
}
setInterval(function () {
  if (!player || !player.getPlayerState || player.getPlayerState() !== 1) return;
  var t = player.getCurrentTime();
  if (stopAt !== null && t >= stopAt) {
    stopAt = null; heldAt = t; player.pauseVideo(); send({ type: 'segmentEnd' }); return;
  }
  // The player still reports "playing" for a moment after pausing, at a time that is already in the next line.
  if (heldAt !== null) { if (Math.abs(t - heldAt) < 0.5) return; heldAt = null; }
  send({ type: 'time', t: t });
}, 100);
window.playSegment = function (a, b) { if (!player) return; stopAt = b; heldAt = null; player.seekTo(a, true); player.playVideo(); };
window.pauseSegment = function () { stopAt = null; if (player) player.pauseVideo(); };
</script><script src="https://www.youtube.com/iframe_api"></script></body></html>`;

export function YouTubePlayer({ ref, videoId, onTime, onSegmentEnd, onPlayingChange, onError }: Props) {
  const view = useRef<WebView<object>>(null);
  // `videoId` is interpolated into the page, so only a well-formed id is ever used.
  const source = useMemo(
    () => ({ html: page(isVideoId(videoId) ? videoId : ''), baseUrl: ORIGIN }),
    [videoId],
  );

  useImperativeHandle(ref, () => ({
    playSegment: (start, end) =>
      view.current?.injectJavaScript(`window.playSegment(${Number(start)}, ${Number(end)}); true;`),
    pause: () => view.current?.injectJavaScript('window.pauseSegment(); true;'),
  }), []);

  function receive(event: WebViewMessageEvent) {
    let data: unknown;
    try { data = JSON.parse(event.nativeEvent.data); } catch { return; }
    const parsed = message.safeParse(data);
    if (!parsed.success) return;
    if (parsed.data.type === 'time') onTime(parsed.data.t);
    else if (parsed.data.type === 'segmentEnd') onSegmentEnd();
    else if (parsed.data.type === 'state') onPlayingChange(parsed.data.playing);
    else if (parsed.data.type === 'error') onError(parsed.data.code);
  }

  return (
    <View style={styles.frame}>
      <WebView<object>
        ref={view}
        source={source}
        onMessage={receive}
        originWhitelist={['https://*', 'about:blank']}
        onShouldStartLoadWithRequest={(request: { url: string }) => ALLOWED.test(request.url)}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        scrollEnabled={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
