import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyPanel, StudyPills, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { studyColors } from '@/constants/study-colors';
import { aiIcons, type AiLevel } from '@/features/ai/ai-catalog';
import { correctionOptions } from '@/features/ai/ai-service';
import { AiJapanese, AiPlay, withoutReading } from '@/features/ai/ai-ui';

export function ChatCorrection({ sentence, level, advanced, close, onApply }: { sentence: string; level: AiLevel; advanced: boolean; close: () => void; onApply: (value: string) => void }) {
  const [tab, select] = useState<'Sửa lỗi' | 'Gợi ý nâng cao'>(advanced ? 'Gợi ý nâng cao' : 'Sửa lỗi');
  const correction = useQuery(correctionOptions(sentence, level));
  const suggested = correction.data && (tab === 'Sửa lỗi' ? correction.data.corrected : correction.data.natural);
  return (
    <StudyScreen title="Gợi ý & Sửa lỗi" back="/practice/chat/history" onBack={close}
      footer={<StudyActionButton label="Áp dụng vào hội thoại" disabled={!suggested} onPress={() => { if (suggested) onApply(suggested); }} />}>
      <StudyPills options={['Sửa lỗi', 'Gợi ý nâng cao']} current={tab} onSelect={select} />
      <StudyText heading>Câu của bạn</StudyText>
      <CorrectionCard text={withoutReading(sentence)} />
      {correction.isPending && <StudyText>Đang phân tích câu…</StudyText>}
      {correction.isError && <StudyActionButton label="Thử phân tích lại" secondary onPress={() => void correction.refetch()} />}
      {correction.data && suggested && (
        <>
          <StudyText heading>Sửa và gợi ý</StudyText>
          <CorrectionCard text={suggested} success />
          <StudyPanel><StudyText heading>Giải thích</StudyText><StudyText>{correction.data.explanation}</StudyText></StudyPanel>
          <CorrectionCard text={correction.data.natural} caption={correction.data.translation} />
        </>
      )}
    </StudyScreen>
  );
}

function CorrectionCard({ text, caption, success }: { text: string; caption?: string; success?: boolean }) {
  const colors = useStudyColors();
  const dark = colors === studyColors.dark;
  return (
    <View style={[styles.correction, { backgroundColor: success ? (dark ? '#254537' : '#E4F5E6') : colors.iconFill }]}>
      {success && <StudyIcon name={aiIcons.check} size={18} color={colors.green} />}
      <View style={styles.fill}>
        <AiJapanese text={text} color={success ? colors.green : colors.title} />
        {!!caption && <StudyText>{caption}</StudyText>}
      </View>
      <AiPlay text={text} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  correction: { borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10 },
});
