import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, type StudySymbol } from '@/components/ui/study-icon';
import { StudyActionButton, StudyPanel, StudyPills, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { generateReadingExercise } from '@/features/practice/services/study-tools-service';
import { readingArticleHref } from '@/features/reading/components/reading-browser';
import { readingIcons } from '@/features/reading/components/reading-ui';
import { preferredReadingLevels, readingLengths, readingTopics, type ReadingGeneration, type ReadingArticle } from '@/features/reading/data/reading-schema';
import { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';

const lengths = ['short', 'medium', 'long'] as const;
const topics = ['daily', 'family', 'school', 'travel'] as const;
const counts = [3, 4, 5, 6] as const;
const lengthLabel = (length: keyof typeof readingLengths) => `${readingLengths[length].label} (~ ${readingLengths[length].minutes} phút)`;
const questionLabel = (count: number) => `${count} câu hỏi`;

export function ReadingCreator() {
  return (
    <StudyScreen title="Tạo bài đọc bằng AI" back="/practice/reading">
      <ReadingForm />
    </StudyScreen>
  );
}

function ReadingForm() {
  const router = useRouter();
  const study = useReadingProgress();
  const request = useRef<AbortController | null>(null);
  const [level, setLevel] = useState<typeof preferredReadingLevels[number]>('N5');
  const [settings, setSettings] = useState<ReadingGeneration>({ topic: 'daily', length: 'short', questionCount: 4 });
  const [expanded, setExpanded] = useState<keyof ReadingGeneration | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useFocusEffect(useCallback(() => () => {
    const current = request.current;
    request.current = null;
    current?.abort();
    if (current) setPending(false);
  }, []));

  async function create() {
    if (!study.ready || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setExpanded(null);
    setPending(true);
    setMessage('');
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const exercise = await generateReadingExercise(level, controller.signal, settings);
      if (request.current !== controller || controller.signal.aborted) return;
      const article: ReadingArticle = {
        ...exercise,
        topic: readingTopics[settings.topic],
        minutes: readingLengths[settings.length].minutes,
        source: 'ai',
      };
      study.record({ type: 'add', article });
      router.push(readingArticleHref(article.id));
    } catch (error) {
      if (request.current === controller) {
        setMessage(controller.signal.aborted ? 'Tạo bài đọc mất quá nhiều thời gian. Hãy thử lại.'
          : error instanceof Error && error.message === 'Reading settings not supported'
            ? 'Máy chủ đang chạy bản tạo bài cũ. Hãy cập nhật dịch vụ AI để sử dụng các tùy chọn này.'
            : 'Chưa tạo được bài đọc. Hãy kiểm tra kết nối rồi thử lại.');
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setPending(false);
      }
    }
  }

  return (
    <>
      <View style={styles.field}>
        <StudyText heading>Trình độ</StudyText>
        <StudyPills options={preferredReadingLevels} current={level} onSelect={(item) => { if (!pending) setLevel(item); }} />
      </View>
      <SettingMenu title="Chủ đề" choices={topics} value={settings.topic} label={(item) => readingTopics[item]}
        icon={readingIcons.document} expanded={expanded === 'topic'} disabled={pending}
        toggle={() => setExpanded((value) => value === 'topic' ? null : 'topic')}
        select={(topic) => { setSettings((previous) => ({ ...previous, topic })); setExpanded(null); }} />
      <SettingMenu title="Độ dài" choices={lengths} value={settings.length} label={lengthLabel}
        icon={readingIcons.chart} expanded={expanded === 'length'} disabled={pending}
        toggle={() => setExpanded((value) => value === 'length' ? null : 'length')}
        select={(length) => { setSettings((previous) => ({ ...previous, length })); setExpanded(null); }} />
      <SettingMenu title="Số câu hỏi" choices={counts} value={settings.questionCount} label={questionLabel}
        icon={readingIcons.count} expanded={expanded === 'questionCount'} disabled={pending}
        toggle={() => setExpanded((value) => value === 'questionCount' ? null : 'questionCount')}
        select={(questionCount) => { setSettings((previous) => ({ ...previous, questionCount })); setExpanded(null); }} />
      <View style={styles.submit}>
        <StudyActionButton icon={readingIcons.sparkles} label={pending ? 'AI đang tạo bài…' : 'Tạo bài đọc'}
          onPress={() => void create()} disabled={pending || !study.ready} />
      </View>
      {!!message && <StudyPanel><Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text></StudyPanel>}
      {study.readError && <StudyActionButton secondary label="Tải lại dữ liệu đọc" onPress={() => void study.retry()} />}
    </>
  );
}

function SettingMenu<T extends string | number>({ title, value, choices, label, icon, expanded, disabled, toggle, select }: {
  title: string;
  value: T;
  choices: readonly T[];
  label: (choice: T) => string;
  icon: StudySymbol;
  expanded: boolean;
  disabled: boolean;
  toggle: () => void;
  select: (choice: T) => void;
}) {
  const colors = useStudyColors();
  return (
    <View style={styles.field}>
      <StudyText heading>{title}</StudyText>
      <StudyPanel style={styles.menu}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${label(value)}`}
          accessibilityState={{ expanded, disabled }} disabled={disabled} onPress={toggle} style={styles.current}>
          <StudyIcon name={icon} color={colors.icon} size={18} />
          <Text style={[styles.selection, { color: colors.title }]}>{label(value)}</Text>
          <StudyIcon name={expanded ? readingIcons.up : readingIcons.down} color={colors.icon} size={15} />
        </Pressable>
        {expanded && choices.map((choice) => (
          <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: choice === value }} onPress={() => select(choice)}
            style={[styles.choice, { backgroundColor: choice === value ? colors.iconFill : 'transparent' }]}>
            <Text style={[styles.selection, { color: choice === value ? colors.blue : colors.title }]}>{label(choice)}</Text>
            {choice === value && <StudyIcon name={readingIcons.check} color={colors.icon} size={15} />}
          </Pressable>
        ))}
      </StudyPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, marginBottom: 4 },
  menu: { gap: 2, padding: 4, borderRadius: 15 },
  current: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 43, paddingHorizontal: 8 },
  selection: { flex: 1, fontSize: 14, fontWeight: '600' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 3, paddingHorizontal: 9, minHeight: 40, borderRadius: 10 },
  submit: { paddingTop: 9 },
  error: { color: '#AB3944', fontSize: 13, lineHeight: 19 },
});
