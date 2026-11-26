import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, useLearnerPalette } from '@/components/ui/learner-glass';
import { parseVideoId } from '@/features/youtube/utils/youtube';

export function YouTubeEntryScreen() {
  const router = useRouter();
  const palette = useLearnerPalette();
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  function open() {
    const videoId = parseVideoId(link);
    if (!videoId) {
      setError('Link chưa đúng. Dán link video YouTube, ví dụ https://youtu.be/xxxxxxxxxxx.');
      return;
    }
    setError('');
    router.push(`/practice/youtube/${videoId}` as Href);
  }

  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="Luyện tập" />
      <LearnerHeading title="Shadowing YouTube" description="Dán link một video tiếng Nhật có phụ đề, nghe từng câu rồi đọc theo." />
      <LearnerPanel>
        <TextInput
          accessibilityLabel="Link video YouTube"
          placeholder="https://www.youtube.com/watch?v=…"
          placeholderTextColor="#8A94A6"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          value={link}
          onChangeText={setLink}
          onSubmitEditing={open}
          style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        />
        {!!error && <ThemedText accessibilityLiveRegion="polite">{error}</ThemedText>}
        <LearnerControl label="Mở video" tone="primary" disabled={!link.trim()} onPress={open} />
        <ThemedText type="small" themeColor="textSecondary">
          Phụ đề được lấy bằng cách không chính thức nên đôi khi có thể không tải được. Chỉ dùng để tự học.
        </ThemedText>
      </LearnerPanel>
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 50, fontSize: 16 },
});
