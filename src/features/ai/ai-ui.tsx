import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, type StudySymbol } from '@/components/ui/study-icon';
import { StudyChevron } from '@/components/ui/study-navigation';
import { StudyIconButton, useStudyColors } from '@/components/ui/study-screen';
import { aiIcons, type ScenarioId } from '@/features/ai/ai-catalog';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

const store = require('@/assets/images/ai/convenience-store.jpg') as number;
export const scenarioArt = {
  intro: require('@/assets/images/lesson-video-poster.jpg') as number,
  shop: store,
  direction: require('@/assets/images/listening-fuji.jpg') as number,
  restaurant: require('@/assets/images/lesson-room-cover.jpg') as number,
} satisfies Record<ScenarioId, number>;

export function AiAvatar({ size = 38 }: { size?: number }) {
  const colors = useStudyColors();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.iconFill }]}>
      <Image source={store} contentFit="cover" style={{ position: 'absolute', left: -size * 0.5, top: -size * 0.06, width: size * 2, height: size * 2.5 }} />
    </View>
  );
}

export function AiPlay({ text }: { text: string }) {
  const speech = useStudySpeech([withoutReading(text)]);
  return <StudyIconButton icon={speech.playing ? aiIcons.stop : aiIcons.listen} label={speech.playing ? 'Dừng đọc' : 'Nghe câu tiếng Nhật'}
    size={32} onPress={() => speech.playing ? speech.stop() : void speech.play(0)} />;
}

const readings = /[（(]([\p{Script=Hiragana}\p{Script=Katakana}ー\s]+)[）)]/gu;
export const withoutReading = (value: string) => value.replace(readings, '');

export function splitAiLine(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const translation = lines.findIndex((line) => /\p{Script=Latin}/u.test(line) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(line));
  if (translation <= 0) return { japanese: text.trim(), vietnamese: '' };
  return { japanese: lines.slice(0, translation).join('\n').trim(), vietnamese: lines.slice(translation).join('\n').trim() };
}

export function AiJapanese({ text, furigana = false, color }: { text: string; furigana?: boolean; color?: string }) {
  const colors = useStudyColors();
  const reading = furigana ? [...text.matchAll(readings)].map((match) => match[1]).join('  ') : '';
  return (
    <View style={styles.japanese}>
      {!!reading && <Text style={[styles.reading, { color: color ?? colors.blue }]}>{reading}</Text>}
      <Text selectable style={[styles.japaneseText, { color: color ?? colors.title }]}>{withoutReading(text)}</Text>
    </View>
  );
}

export function AiTopicRow({ title, subtitle, icon, end, image, avatar, onPress }: {
  title: string; subtitle?: string; icon: StudySymbol; end?: string; image?: number; avatar?: boolean; onPress: () => void;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.topic, {
      backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1,
      boxShadow: `0px 3px 9px ${colors.shadow}`,
    }]}>
      {avatar ? <AiAvatar /> : image ? <Image source={image} style={styles.thumbnail} contentFit="cover" /> : (
        <View style={[styles.topicIcon, { backgroundColor: colors.iconFill }]}>
          <StudyIcon name={icon} color={colors.icon} size={22} />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={[styles.topicTitle, { color: colors.title }]}>{title}</Text>
        {!!subtitle && <Text numberOfLines={1} style={[styles.detail, { color: colors.secondary }]}>{subtitle}</Text>}
      </View>
      {end ? <Text style={[styles.detail, { color: colors.secondary }]}>{end}</Text> : <StudyChevron size={15} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topic: { minHeight: 55, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingVertical: 7 },
  avatar: { overflow: 'hidden' },
  topicIcon: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  thumbnail: { width: 64, height: 49, borderRadius: 11 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  topicTitle: { fontSize: 14, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 16 },
  japanese: { gap: 2, minWidth: 0 },
  japaneseText: { fontSize: 16, fontWeight: '600', lineHeight: 26 },
  reading: { fontSize: 10, lineHeight: 13 },
});
