import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LearnerBack } from '@/components/ui/learner-detail';
import { LearnerControl } from '@/components/ui/learner-glass';
import { describeVoiceError } from '@/features/practice/services/voice-errors';
import { useChannels, useChannelVideos } from '@/features/youtube/hooks/use-youtube';
import { formatDate } from '@/features/youtube/utils/youtube';

/** Pick a video from the Japanese shadowing channels configured on the AI platform. */
export function YouTubeEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const channels = useChannels();
  const [picked, setPicked] = useState<string>();
  const channel = channels.data?.find((item) => item.id === picked) ?? channels.data?.[0];
  const videos = useChannelVideos(channel?.id);
  const failed = channels.error ?? videos.error;

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={videos.data ?? []}
        keyExtractor={(video) => video.videoId}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshing={videos.isRefetching}
        onRefresh={channel ? () => void videos.refetch() : undefined}
        ListHeaderComponent={(
          <View style={styles.header}>
            <LearnerBack href="/practice" label="Luyện tập" />
            <ThemedText type="subtitle">Shadowing YouTube</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channels}>
              {channels.data?.map((item) => (
                <LearnerControl
                  key={item.id}
                  label={item.name}
                  selected={item.id === channel?.id}
                  onPress={() => setPicked(item.id)}
                />
              ))}
            </ScrollView>
            {channel && (
              <ThemedText type="small" themeColor="textSecondary">
                {channel.description}
                {channel.captions === 'auto' ? ' Phụ đề tự động của YouTube, có thể sai chữ.' : ''}
              </ThemedText>
            )}
            {(channels.isPending || (channel && videos.isPending)) && <ActivityIndicator />}
            {failed && (
              <View style={styles.error}>
                <ThemedText accessibilityLiveRegion="polite">
                  {describeVoiceError(failed) ?? 'Không tải được danh sách video. Kiểm tra máy chủ AI rồi thử lại.'}
                </ThemedText>
                <LearnerControl label="Thử lại" onPress={() => void (channels.error ? channels.refetch() : videos.refetch())} />
              </View>
            )}
            {videos.data?.length === 0 && <ThemedText>Kênh này chưa có video.</ThemedText>}
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/practice/youtube/${item.videoId}` as Href)}
            style={({ pressed }) => [styles.video, pressed && styles.pressed]}>
            <Image source={item.thumbnailUrl} style={styles.thumbnail} contentFit="cover" />
            <View style={styles.copy}>
              <ThemedText type="smallBold" numberOfLines={3}>{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{formatDate(item.publishedAt)}</ThemedText>
            </View>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: 16 },
  header: { gap: 12, paddingVertical: 12, alignItems: 'stretch' },
  channels: { gap: 8 },
  error: { gap: 8 },
  video: {
    flexDirection: 'row', gap: 12, padding: 8, marginBottom: 8, borderRadius: 14,
    backgroundColor: 'rgba(127,127,127,0.10)',
  },
  thumbnail: { width: 128, aspectRatio: 16 / 9, borderRadius: 8, alignSelf: 'center' },
  copy: { flex: 1, gap: 4 },
  pressed: { opacity: 0.7 },
});
