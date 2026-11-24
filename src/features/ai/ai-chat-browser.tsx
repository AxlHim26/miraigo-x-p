import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { StudyIcon, type StudySymbol } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { studyColors } from '@/constants/study-colors';
import { aiIcons, aiLevels, chatTopics, favoriteTopics, type ChatTopic } from '@/features/ai/ai-catalog';
import { AiTopicRow, scenarioArt, splitAiLine, withoutReading } from '@/features/ai/ai-ui';
import { makeAiThread, useAiWorkspace, type AiSettings } from '@/features/ai/use-ai-workspace';

const filters = ['Tất cả', ...aiLevels] as const;

export function useOpenAiThread() {
  const router = useRouter();
  const workspace = useAiWorkspace();
  const [error, setError] = useState('');
  async function open(topic?: ChatTopic) {
    if (workspace.saving || !workspace.data) return;
    setError('');
    const thread = makeAiThread(workspace.data.settings, topic);
    try {
      await workspace.save((current) => ({ ...current, threads: [thread, ...current.threads].slice(0, 40) }));
      router.push({ pathname: '/practice/chat/[threadId]', params: { threadId: thread.id } });
    } catch {
      setError('Chưa lưu được cuộc trò chuyện. Hãy thử lại.');
    }
  }
  return { ...workspace, open, actionError: error };
}

export function AiChatHome() {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  return (
    <StudyScreen title="AI Chat" largeTitle scrollRef={scroll}>
      <AiChatLanding showTopics={() => scroll.current?.scrollToEnd({ animated: true })} />
    </StudyScreen>
  );
}

function AiChatLanding({ showTopics }: { showTopics: () => void }) {
  const router = useRouter();
  const workspace = useOpenAiThread();
  const colors = useStudyColors();
  return (
    <>
      <Text style={[styles.introText, { color: colors.text }]}>Trò chuyện tự nhiên với AI để luyện tiếng Nhật mỗi ngày.</Text>
      <StudyActionButton label="Bắt đầu trò chuyện" icon={aiIcons.chat}
        disabled={!workspace.data || workspace.saving} onPress={() => void workspace.open()} />
      <View style={styles.row}>
        <ModeTile title="Gọi thoại" subtitle="Nói theo tình huống" icon={aiIcons.phone} onPress={() => router.push('/practice/ai-dialogue')} />
        <ModeTile title="Luyện phát âm" subtitle="Nghe và nói lại" icon={aiIcons.waveform}
          onPress={() => router.push({ pathname: '/practice/voice/[mode]', params: { mode: 'pronunciation' } })} />
        <ModeTile title="Chủ đề gợi ý" subtitle="Đời sống, công việc" icon={aiIcons.chat} onPress={showTopics} />
      </View>
      <View style={styles.section}>
        <StudyText heading>Cuộc trò chuyện gần đây</StudyText>
        <Pressable accessibilityRole="link" onPress={() => router.push('/practice/chat/history')} hitSlop={6}>
          <Text style={[styles.more, { color: colors.blue }]}>Xem tất cả ›</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {workspace.data?.threads.slice(0, 4).map((thread) => (
          <AiTopicRow key={thread.id} title={thread.title} avatar icon={aiIcons.chat}
            subtitle={withoutReading(splitAiLine(thread.messages.at(-1)?.content ?? '').japanese).replace(/\s+/g, ' ')}
            onPress={() => router.push({ pathname: '/practice/chat/[threadId]', params: { threadId: thread.id } })} />
        ))}
        {workspace.data?.threads.length === 0 && <StudyText>Cuộc trò chuyện đã lưu sẽ hiện ở đây.</StudyText>}
      </View>
      <StudyText heading>Chủ đề gợi ý</StudyText>
      <View style={styles.row}>
        {chatTopics.slice(0, 4).map((topic, index) => (
          <Pressable key={topic.id} accessibilityRole="button" onPress={() => void workspace.open(topic)}
            style={({ pressed }) => [styles.topicCard, { backgroundColor: colors.surface, opacity: pressed ? 0.65 : 1 }]}>
            <Image source={[scenarioArt.intro, scenarioArt.shop, scenarioArt.direction, scenarioArt.restaurant][index]}
              style={styles.topicImage} contentFit="cover" />
            <Text style={[styles.topicLabel, { color: colors.title }]} numberOfLines={2}>{topic.title}</Text>
          </Pressable>
        ))}
      </View>
      {!!workspace.actionError && <StudyText>{workspace.actionError}</StudyText>}
    </>
  );
}

function ModeTile({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: StudySymbol; onPress: () => void }) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tile,
      { backgroundColor: colors.surface, opacity: pressed ? 0.65 : 1 }]}>
      <StudyIcon name={icon} size={22} color={colors.icon} />
      <Text style={[styles.tileTitle, { color: colors.title }]}>{title}</Text>
      <Text style={[styles.tileHint, { color: colors.secondary }]}>{subtitle}</Text>
    </Pressable>
  );
}

export function AiChatHistory() {
  const router = useRouter();
  const workspace = useOpenAiThread();
  const [filter, select] = useState<typeof filters[number]>('Tất cả');
  const threads = workspace.data?.threads.filter((thread) => filter === 'Tất cả' || filter === thread.level) ?? [];
  return (
    <StudyScreen title="AI Chat" back="/practice/chat"
      action={<View style={styles.toolbar}>
        <StudyIconButton icon={aiIcons.settings} label="Cài đặt AI Chat" size={36} onPress={() => router.push('/practice/chat/settings')} />
        <StudyIconButton icon={aiIcons.add} label="Cuộc trò chuyện mới" size={36} disabled={!workspace.data || workspace.saving} onPress={() => void workspace.open()} />
      </View>}>
      <StudyPills options={filters} current={filter} onSelect={select} />
      <View style={styles.list}>
        {threads.map((thread) => {
          const topic = chatTopics.find((item) => item.title === thread.title);
          const last = withoutReading(splitAiLine(thread.messages.at(-1)?.content ?? '').japanese).replace(/\s+/g, ' ');
          return <AiTopicRow key={thread.id} title={thread.title} subtitle={last}
            avatar end={new Date(thread.updatedAt).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })}
            icon={topic?.icon ?? aiIcons.chat}
            onPress={() => router.push({ pathname: '/practice/chat/[threadId]', params: { threadId: thread.id } })} />;
        })}
      </View>
      {!threads.length && !workspace.pending && <StudyText>Chưa có cuộc trò chuyện ở bộ lọc này.</StudyText>}
      {!!workspace.error && <StudyText>Chưa tải được lịch sử trò chuyện.</StudyText>}
      {!!workspace.actionError && <StudyText>{workspace.actionError}</StudyText>}
    </StudyScreen>
  );
}

export function AiChatSettings() {
  const workspace = useAiWorkspace();
  const [error, setError] = useState('');
  const settings = workspace.data?.settings;
  function save(patch: Partial<AiSettings>) {
    if (!settings) return;
    setError('');
    void workspace.save((current) => ({ ...current, settings: { ...current.settings, ...patch } })).catch(() => setError('Chưa lưu được cài đặt.'));
  }
  return (
    <StudyScreen title="Cài đặt AI Chat" back="/practice/chat/history">
      {settings ? (
        <>
          <StudyText heading>Cấp độ luyện tập</StudyText>
          <StudyPills options={aiLevels} current={settings.level} onSelect={(level) => save({ level })} />
          <StudyText heading>Chủ đề yêu thích</StudyText>
          <TopicChoices selected={settings.topics} change={(topic) => {
            save({ topics: settings.topics.includes(topic) ? settings.topics.filter((item) => item !== topic) : [...settings.topics, topic] });
          }} />
          <StudyPanel style={styles.toggles}>
            <OptionSwitch label="Hiển thị Furigana" value={settings.furigana} onChange={(furigana) => save({ furigana })} />
            <OptionSwitch label="Hiển thị bản dịch tiếng Việt" value={settings.translation} onChange={(translation) => save({ translation })} />
            <OptionSwitch label="Sửa lỗi tự động" value={settings.autoCorrect} onChange={(autoCorrect) => save({ autoCorrect })} />
          </StudyPanel>
        </>
      ) : <StudyText>{workspace.error ? 'Chưa đọc được cài đặt.' : 'Đang tải cài đặt…'}</StudyText>}
      {!!error && <StudyText>{error}</StudyText>}
    </StudyScreen>
  );
}

function TopicChoices({ selected, change }: { selected: AiSettings['topics']; change: (topic: AiSettings['topics'][number]) => void }) {
  const colors = useStudyColors();
  return (
    <View style={styles.topicGrid}>
      {favoriteTopics.map((topic) => {
        const checked = selected.includes(topic);
        return <Pressable key={topic} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => change(topic)}
          style={({ pressed }) => [styles.choice, { backgroundColor: checked ? colors.iconFill : colors.surface, opacity: pressed ? 0.67 : 1 }]}>
          <StudyIcon name={checked ? aiIcons.check : aiIcons.chat} size={16} color={colors.icon} />
          <Text style={[styles.choiceText, { color: colors.text }]}>{topic}</Text>
        </Pressable>;
      })}
    </View>
  );
}

function OptionSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (checked: boolean) => void }) {
  const colors = useStudyColors();
  return (
    <View style={styles.option}>
      <Text style={[styles.optionLabel, { color: colors.title }]}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange}
        trackColor={{ false: colors.track, true: studyColors.light.icon }} thumbColor="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  introText: { fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 9 },
  tile: { flex: 1, gap: 5, minWidth: 0, minHeight: 86, borderRadius: 17, padding: 8, alignItems: 'center', justifyContent: 'center' },
  topicCard: { flex: 1, minWidth: 0, borderRadius: 14, overflow: 'hidden', gap: 3 },
  topicImage: { width: '100%', height: 58 },
  topicLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600', textAlign: 'center', padding: 4 },
  tileTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tileHint: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  more: { fontSize: 12, fontWeight: '600' },
  list: { gap: 7 },
  toolbar: { flexDirection: 'row', gap: 4 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { width: '48%', minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 14 },
  choiceText: { flex: 1, fontSize: 12, fontWeight: '600' },
  toggles: { gap: 2 },
  option: { minHeight: 51, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
});
