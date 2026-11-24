import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { LearnerExternalAction } from '@/components/ui/learner-detail';
import { LearnerControl, LearnerPanel, useLearnerPalette } from '@/components/ui/learner-glass';
import { findWebTool, resolveFrontendUrl } from '@/features/web-tools/data/web-tools';

export default function StudyToolScreen() {
  const { path } = useLocalSearchParams<{ path?: string }>();
  const tool = findWebTool(path);
  const url = tool && resolveFrontendUrl(tool.path);
  const palette = useLearnerPalette();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <LearnerControl label="Đóng" glyph="‹" onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/practice');
        }} />
        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>{tool?.label ?? 'Công cụ học tập'}</ThemedText>
      </View>
      {url
        ? <ToolContent key={url} url={url} />
        : <LearnerPanel><ThemedText>Công cụ này chưa có địa chỉ MiraiGo Web.</ThemedText></LearnerPanel>}
    </SafeAreaView>
  );
}

function ToolContent({ url }: { url: string }) {
  const webView = useRef<WebView<object>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const origin = new URL(url).origin;

  if (failed) return (
    <LearnerPanel style={styles.error}>
      <ThemedText>Không tải được công cụ. Hãy kiểm tra kết nối với MiraiGo Web.</ThemedText>
      <LearnerControl label="Thử lại" onPress={() => { setFailed(false); setReloadKey((key) => key + 1); }} />
      <LearnerExternalAction label="Mở bằng trình duyệt" url={url} />
    </LearnerPanel>
  );

  return (
    <>
      {canGoBack && <LearnerControl label="Trang trước" glyph="‹" onPress={() => webView.current?.goBack()} />}
      <WebView<object>
        key={reloadKey}
        ref={webView}
        source={{ uri: url }}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(request) => {
          try {
            return request.isTopFrame === false || new URL(request.url).origin === origin;
          } catch {
            return false;
          }
        }}
        onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
        onError={() => setFailed(true)}
        startInLoadingState
        incognito
        sharedCookiesEnabled={false}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaCapturePermissionGrantType="prompt"
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  title: { flex: 1 },
  error: { margin: 12 },
});
