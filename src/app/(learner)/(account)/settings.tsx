import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, LearnerSectionHeading, useLearnerPalette } from '@/components/ui/learner-glass';

const preferences = [
  { glyph: '◐', title: 'Giao diện', detail: 'Tự động theo cài đặt thiết bị' },
  { glyph: '文', title: 'Ngôn ngữ học', detail: 'Tiếng Nhật' },
  { glyph: '◉', title: 'Thông báo học tập', detail: 'Nhắc bạn duy trì thói quen mỗi ngày' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const palette = useLearnerPalette();

  return (
    <LearnerCanvas>
      <LearnerControl
        label="Tài khoản"
        glyph="‹"
        onPress={() => router.dismissTo('/account')}
        style={styles.back}
      />
      <LearnerHeading eyebrow="TÙY CHỈNH TRẢI NGHIỆM" title="Cài đặt" description="Thiết lập MiraiGo theo cách phù hợp với bạn." />

      <LearnerSectionHeading title="Tùy chọn học tập" />
      <LearnerPanel>
        {preferences.map((item, index) => (
          <View key={item.title} style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.border }]}>
            <View style={[styles.icon, { backgroundColor: palette.selection }]}>
              <ThemedText accessible={false} type="smallBold" style={{ color: palette.accentText }}>{item.glyph}</ThemedText>
            </View>
            <View style={styles.copy}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{item.detail}</ThemedText>
            </View>
          </View>
        ))}
      </LearnerPanel>

      <LearnerSectionHeading title="Về MiraiGo" />
      <LearnerPanel>
        <ThemedText type="smallBold">MiraiGo x-p</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Ứng dụng học tiếng Nhật đa nền tảng.</ThemedText>
        <View style={[styles.version, { borderColor: palette.border }]}>
          <ThemedText type="small" themeColor="textSecondary">Phiên bản</ThemedText>
          <ThemedText type="smallBold">1.0.0</ThemedText>
        </View>
      </LearnerPanel>
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  icon: { minWidth: 38, minHeight: 38, padding: 7, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  version: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
});
