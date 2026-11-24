import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerControl, LearnerPanel, useLearnerPalette } from '@/components/ui/learner-glass';
import { vocabularyLevels, type SetInput, type WordInput } from '@/features/vocabulary/services/vocabulary-sets-service';
import { useTheme } from '@/hooks/use-theme';

type FormProps<T> = {
  initial?: T;
  pending: boolean;
  onSubmit: (value: T) => void;
  onCancel: () => void;
};

export function VocabularySetForm({ initial, pending, onSubmit, onCancel }: FormProps<SetInput>) {
  const [value, setValue] = useState<SetInput>(initial ?? { title: '', isCommunity: false });
  return (
    <LearnerPanel>
      <ThemedText type="smallBold">{initial ? 'Sửa bộ từ' : 'Tạo bộ từ mới'}</ThemedText>
      <Field label="Tên bộ từ" maxLength={200} value={value.title} onChange={(title) => setValue({ ...value, title })} />
      <Field label="Mô tả" maxLength={2000} value={value.description ?? ''} onChange={(description) => setValue({ ...value, description })} multiline />
      <View style={styles.row}>
        <LearnerControl label="Mọi cấp độ" selected={!value.level} onPress={() => setValue({ ...value, level: undefined })} />
        {vocabularyLevels.map((level) => <LearnerControl key={level} label={level} selected={level === value.level} onPress={() => setValue({ ...value, level })} />)}
      </View>
      <LearnerControl label="Chia sẻ với cộng đồng" selected={value.isCommunity} onPress={() => setValue({ ...value, isCommunity: !value.isCommunity })} />
      <FormActions pending={pending} valid={!!value.title.trim()} onSave={() => onSubmit(value)} onCancel={onCancel} />
    </LearnerPanel>
  );
}

const wordFields = [
  { key: 'japanese', label: 'Từ tiếng Nhật', max: 200 },
  { key: 'reading', label: 'Cách đọc', max: 200 },
  { key: 'meaning', label: 'Nghĩa', max: 1000 },
  { key: 'example', label: 'Câu ví dụ', max: 2000 },
  { key: 'exampleMeaning', label: 'Nghĩa câu ví dụ', max: 2000 },
] as const;

export function VocabularyWordForm({ initial, pending, onSubmit, onCancel }: FormProps<WordInput>) {
  const [value, setValue] = useState<WordInput>(initial ?? { japanese: '', reading: '', meaning: '' });
  const valid = Boolean(value.japanese.trim() && value.reading.trim() && value.meaning.trim());
  return (
    <LearnerPanel>
      <ThemedText type="smallBold">{initial ? 'Sửa từ' : 'Thêm từ'}</ThemedText>
      {wordFields.map(({ key, label, max }) => (
        <Field key={key} label={label} maxLength={max} value={value[key] ?? ''} onChange={(text) => setValue({ ...value, [key]: text })} />
      ))}
      <FormActions pending={pending} valid={valid} onSave={() => onSubmit(value)} onCancel={onCancel} />
    </LearnerPanel>
  );
}

function Field({ label, value, maxLength, onChange, multiline }: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (text: string) => void;
  multiline?: boolean;
}) {
  const palette = useLearnerPalette();
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput accessibilityLabel={label} value={value} maxLength={maxLength} onChangeText={onChange}
        placeholder={label} placeholderTextColor={theme.textSecondary} multiline={multiline}
        style={[styles.input, { borderColor: palette.border, color: palette.text }]} />
    </View>
  );
}

function FormActions({ pending, valid, onSave, onCancel }: {
  pending: boolean;
  valid: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.row}>
      <LearnerControl label="Hủy" disabled={pending} onPress={onCancel} />
      <LearnerControl label={pending ? 'Đang lưu…' : 'Lưu'} disabled={pending || !valid} tone="accent" onPress={onSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 5 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 46, padding: 10, fontSize: 16 },
});
