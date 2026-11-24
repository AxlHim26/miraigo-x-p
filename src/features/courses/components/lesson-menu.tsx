import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudyIcon } from '@/components/ui/study-icon';
import type { StudyColors } from '@/constants/study-colors';
import { lessonIcons } from '@/features/courses/data/lesson-icons';

type MenuItem = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function LessonMenu({ title, items, message, colors, close }: {
  title: string;
  items: MenuItem[];
  message?: string;
  colors: StudyColors;
  close: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <SafeAreaView style={styles.modal}>
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.title }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: colors.secondary }]}>{message}</Text>}
          <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
            {items.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityState={item.selected === undefined ? undefined : { selected: item.selected }}
                onPress={() => { close(); item.onPress(); }}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: item.selected || pressed ? colors.iconFill : colors.surface },
                ]}>
                <Text style={[styles.label, { color: item.selected ? colors.blue : colors.text }]}>{item.label}</Text>
                {item.selected && <StudyIcon name={lessonIcons.check} color={colors.icon} size={17} />}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={close} style={styles.close}>
            <Text style={[styles.label, { color: colors.blue }]}>Đóng</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#08182B66' },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '88%', alignSelf: 'center', borderRadius: 24, borderWidth: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 20 },
  options: { flexGrow: 0 },
  item: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'space-between', minHeight: 44, borderRadius: 12, marginTop: 5, paddingHorizontal: 12, paddingVertical: 8 },
  close: { minHeight: 44, paddingHorizontal: 12, alignSelf: 'flex-end', justifyContent: 'center' },
  label: { flexShrink: 1, fontSize: 15, fontWeight: '600' },
});
