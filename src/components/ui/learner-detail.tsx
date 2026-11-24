import { Link, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerControl, LearnerPanel } from '@/components/ui/learner-glass';
import { ApiError } from '@/shared/utils/api-error';

export function LearnerBack({ href, label }: { href: Href; label: string }) {
  const router = useRouter();
  return <LearnerControl glyph="‹" label={label} onPress={() => router.dismissTo(href)} style={styles.action} />;
}

export function LearnerLoadState({ pending, error, retry, missing }: {
  pending: boolean;
  error?: unknown;
  retry: () => void;
  missing?: boolean;
}) {
  if (pending) return <LearnerPanel><ThemedText accessibilityLiveRegion="polite">Đang tải nội dung…</ThemedText></LearnerPanel>;
  if (missing || (error instanceof ApiError && error.status === 404)) {
    return <LearnerPanel><ThemedText>Không tìm thấy nội dung này.</ThemedText></LearnerPanel>;
  }
  if (!error) return null;
  return (
    <LearnerPanel>
      <ThemedText>Không tải được nội dung. Vui lòng thử lại.</ThemedText>
      <LearnerControl label="Thử lại" onPress={retry} style={styles.action} />
    </LearnerPanel>
  );
}

export function getHttpUrl(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function LearnerExternalAction({ label, url }: { label: string; url: string }) {
  const [failed, setFailed] = useState(false);
  const href = getHttpUrl(url);
  if (!href) return null;
  return (
    <>
      {Platform.OS === 'web' ? (
        <Link href={href as Href} target="_blank" rel="noopener noreferrer" asChild>
          <LearnerControl label={label} glyph="↗" style={styles.action} />
        </Link>
      ) : (
        <LearnerControl label={label} glyph="↗" style={styles.action} onPress={() => {
          setFailed(false);
          void Linking.openURL(href).catch(() => setFailed(true));
        }} />
      )}
      {failed && <ThemedText type="small" accessibilityLiveRegion="polite">Không mở được liên kết trên thiết bị này.</ThemedText>}
    </>
  );
}

const styles = StyleSheet.create({ action: { alignSelf: 'flex-start', maxWidth: '100%' } });
