import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { studyColors } from '@/constants/study-colors';
import { aiIcons, scenarios } from '@/features/ai/ai-catalog';
import { ChatCorrection } from '@/features/ai/ai-chat-correction';
import { dialogueHref } from '@/features/ai/ai-dialogue';
import { correctionOptions } from '@/features/ai/ai-service';
import { AiAvatar, AiJapanese, AiPlay, scenarioArt, splitAiLine, withoutReading } from '@/features/ai/ai-ui';
import { callTime, useAiWorkspace, type AiCall, type AiSettings, type AiThread } from '@/features/ai/use-ai-workspace';
import { annotateReadingLines, streamPracticeChat } from '@/features/practice/services/study-tools-service';

export function AiChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId?: string }>();
  const workspace = useAiWorkspace();
  const thread = workspace.data?.threads.find((item) => item.id === threadId);
  return thread && workspace.data ? (
    <ChatThread key={thread.id} thread={thread} settings={workspace.data.settings} save={workspace.save} />
  ) : <StudyScreen title="AI Chat" back="/practice/chat/history">
    <StudyText>{workspace.pending ? 'Đang mở cuộc trò chuyện…' : 'Không tìm thấy cuộc trò chuyện.'}</StudyText>
  </StudyScreen>;
}

function ChatThread({ thread, settings, save }: { thread: AiThread; settings: AiSettings; save: ReturnType<typeof useAiWorkspace>['save'] }) {
  const router = useRouter();
  const cache = useQueryClient();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const request = useRef<AbortController | null>(null);
  const [draft, setDraft] = useState('');
  const [outgoing, setOutgoing] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [sentence, setSentence] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [translation, setTranslation] = useState('');
  const requestTranslation = useMutation({
    mutationFn: async (text: string) => {
      const { japanese, vietnamese } = splitAiLine(text);
      if (vietnamese) return vietnamese;
      const items = await annotateReadingLines([withoutReading(japanese).slice(0, 1000)]);
      if (!items[0]?.translation) throw new Error('Missing translation');
      return items[0].translation;
    },
    onSuccess: setTranslation,
  });
  const scene = scenarios.find((item) => item.title === thread.title) ?? scenarios[1];
  const call = () => router.push(dialogueHref(scene, thread.id));
  useFocusEffect(useCallback(() => () => request.current?.abort(), []));

  async function send() {
    const text = draft.trim();
    if (!text || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 120_000);
    setDraft('');
    setTranslation('');
    setError('');
    setReply('');
    setOutgoing(text);
    let full = '';
    try {
      await streamPracticeChat(text, thread.level, thread.messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 3000) })),
        controller.signal, (chunk) => {
          if (!controller.signal.aborted) {
            full += chunk;
            setReply(full.slice(0, 5000));
          }
        }, { includeTranslation: settings.translation });
      if (!full.trim() || controller.signal.aborted) throw new Error('Missing reply');
      await save((current) => {
        const latest = current.threads.find((item) => item.id === thread.id) ?? thread;
        const messages = latest.messages.concat(
          { role: 'user', content: text },
          { role: 'assistant', content: full.trim().slice(0, 5000) },
        ).slice(-60);
        const updated = { ...latest, updatedAt: new Date().toISOString(), messages };
        return { ...current, threads: [updated, ...current.threads.filter((item) => item.id !== thread.id)] };
      });
      if (settings.autoCorrect && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) {
        void cache.prefetchQuery(correctionOptions(text, thread.level));
      }
    } catch {
      setDraft(text);
      if (!controller.signal.aborted) setError('Chưa nhận được phản hồi từ AI. Bạn có thể gửi lại.');
    } finally {
      clearTimeout(timer);
      request.current = null;
      setOutgoing('');
      setReply('');
    }
  }

  if (sentence) return (
    <ChatCorrection sentence={sentence} level={thread.level} advanced={advanced} close={() => setSentence('')}
      onApply={(text) => { setDraft(text); setSentence(''); }} />
  );

  const lastUser = [...thread.messages].reverse().find((message) => message.role === 'user');
  const source = draft.trim() || lastUser?.content || '';
  const lastMessage = thread.messages.at(-1);
  const lastCall = thread.calls?.[0];
  function correct(natural: boolean, text = source) {
    if (text.trim() && !outgoing) {
      setAdvanced(natural);
      setSentence(text);
    }
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <StudyScreen title="AI Chat" subtitle={thread.level + ' · ' + thread.title} titleAccessory={<AiAvatar size={40} />} back="/practice/chat/history"
        action={<View style={styles.toolbar}>
          <StudyIconButton icon={aiIcons.phone} label="Bắt đầu gọi thoại" size={39} disabled={!!outgoing} onPress={call} />
          <StudyIconButton icon={aiIcons.more} label="Cài đặt AI Chat" size={37} onPress={() => router.push('/practice/chat/settings')} />
        </View>}
        scrollRef={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        footer={<View style={styles.footer}>
          <View style={styles.tools}>
            <ChatTool label="Chủ đề" icon={aiIcons.chat} onPress={() => router.push('/practice/chat')} disabled={!!outgoing} />
            <ChatTool label="Sửa lỗi" icon={aiIcons.edit} onPress={() => correct(false)} disabled={!source || !!outgoing} />
            <ChatTool label="Dịch" icon={aiIcons.translate} onPress={() => void requestTranslation.mutate(draft.trim() || lastMessage?.content || '')}
              disabled={!(draft.trim() || lastMessage) || !!outgoing || requestTranslation.isPending} />
            <ChatTool label="Viết lại" icon={aiIcons.edit} onPress={() => correct(true)} disabled={!source || !!outgoing} />
          </View>
          <Composer draft={draft} edit={setDraft} active={!!outgoing} send={() => void send()}
            stop={() => request.current?.abort()} suggest={() => router.push('/practice/chat')} />
        </View>}>
        {thread.messages.map((message, index) => (
          <ChatBubble key={index} message={message} settings={settings}
            correct={message === lastUser && settings.autoCorrect && !outgoing ? () => correct(false, message.content) : undefined} />
        ))}
        {!!outgoing && <ChatBubble message={{ role: 'user', content: outgoing }} settings={settings} />}
        {!!outgoing && <ChatBubble message={{ role: 'assistant', content: reply || 'Đang trả lời…' }} settings={settings} pending={!reply} />}
        {!!translation && <StudyPanel><StudyText heading>Bản dịch tiếng Việt</StudyText><StudyText>{translation}</StudyText></StudyPanel>}
        {requestTranslation.isError && <StudyText>Chưa dịch được câu này. Hãy thử lại.</StudyText>}
        {lastCall ? <CallSummary summary={lastCall} /> : (
          <StudyPanel>
            <View style={styles.scenarioRow}>
              <Image source={scenarioArt[scene.id]} style={styles.scenarioImage} contentFit="cover" />
              <View style={styles.fill}><StudyText>Tình huống</StudyText><StudyText heading>{scene.title}</StudyText><StudyText>{scene.level} · {scene.duration}</StudyText></View>
            </View>
            <StudyActionButton label="Bắt đầu gọi thoại" icon={aiIcons.phone} disabled={!!outgoing} onPress={call} />
          </StudyPanel>
        )}
        {!!error && <StudyText>{error}</StudyText>}
      </StudyScreen>
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ message, settings, correct, pending }: { message: AiThread['messages'][number]; settings: AiSettings; correct?: () => void; pending?: boolean }) {
  const colors = useStudyColors();
  const outgoing = message.role === 'user';
  const line = splitAiLine(message.content);
  const speakable = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(line.japanese);
  return (
    <View style={[styles.chatRow, outgoing && styles.outgoingRow]}>
      {!outgoing && <AiAvatar size={34} />}
      <View style={[styles.bubble, {
        backgroundColor: outgoing ? studyColors.light.icon : colors.surface, boxShadow: `0px 3px 9px ${colors.shadow}`,
      }, outgoing && styles.outgoingBubble]}>
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleCopy}>
            <AiJapanese text={line.japanese} furigana={settings.furigana} color={outgoing ? '#FFFFFF' : colors.title} />
            {settings.translation && !!line.vietnamese && <Text style={[styles.translation, { color: outgoing ? '#EFF7FF' : colors.secondary }]}>{line.vietnamese}</Text>}
            {correct && <Pressable accessibilityRole="button" onPress={correct} hitSlop={6}>
              <Text style={styles.correctText}>Sửa câu</Text>
            </Pressable>}
          </View>
          {!pending && speakable && <AiPlay text={line.japanese} />}
        </View>
      </View>
    </View>
  );
}

function Composer({ draft, edit, active, send, stop, suggest }: {
  draft: string; edit: (value: string) => void; active: boolean; send: () => void; stop: () => void; suggest: () => void;
}) {
  const colors = useStudyColors();
  return (
    <View style={styles.composer}>
      <StudyIconButton icon={aiIcons.add} label="Chọn chủ đề" size={39} disabled={active} onPress={suggest} />
      <TextInput accessibilityLabel="Tin nhắn" placeholder="Nhập tin nhắn..." placeholderTextColor={colors.secondary}
        value={draft} maxLength={1500} multiline editable={!active} onChangeText={edit}
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} />
      <StudyIconButton icon={active ? aiIcons.stop : aiIcons.send} label={active ? 'Dừng trả lời' : 'Gửi tin nhắn'}
        primary size={43} disabled={!active && !draft.trim()} onPress={active ? stop : send} />
    </View>
  );
}

function ChatTool({ label, icon, onPress, disabled }: { label: string; icon: typeof aiIcons.edit; onPress: () => void; disabled?: boolean }) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.tool, { backgroundColor: colors.surface, opacity: pressed || disabled ? 0.5 : 1 }]}>
      <StudyIcon name={icon} size={13} color={colors.icon} /><Text style={[styles.toolLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function CallSummary({ summary }: { summary: AiCall }) {
  const colors = useStudyColors();
  return (
    <>
      <StudyPanel style={[styles.scenarioRow, { backgroundColor: colors.iconFill }]}>
        <StudyIcon name={aiIcons.phone} size={22} color={colors.icon} />
        <View style={styles.fill}><StudyText heading>Cuộc gọi vừa kết thúc</StudyText><StudyText>Thời lượng · {callTime(summary.duration)}</StudyText></View>
      </StudyPanel>
      <StudyPanel>
        <StudyText heading>Tóm tắt buổi hội thoại</StudyText>
        <StudyText>{summary.title} · {summary.turns} lượt nói</StudyText>
        {!!summary.best && <AiJapanese text={summary.best} />}
        <StudyText>{summary.tip}</StudyText>
        <View style={styles.scenarioRow}>
          <View style={styles.fill}>
            <StudyText heading>Đánh giá tổng quan</StudyText>
            <StudyProgressBar fraction={summary.average / 100} />
          </View>
          <StudyRing size={62} progress={summary.average / 100}><StudyText heading>{summary.average}</StudyText></StudyRing>
        </View>
      </StudyPanel>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  chatRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  outgoingRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '86%', borderRadius: 17, borderTopLeftRadius: 7, padding: 11, gap: 5 },
  outgoingBubble: { borderTopLeftRadius: 17, borderBottomRightRadius: 6 },
  translation: { fontSize: 12, lineHeight: 18 },
  bubbleContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bubbleCopy: { flexShrink: 1, minWidth: 0, gap: 4 },
  correctText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  toolbar: { flexDirection: 'row', gap: 4 },
  footer: { gap: 7 },
  tools: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  tool: { flex: 1, minHeight: 34, borderRadius: 17, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  toolLabel: { fontSize: 10, fontWeight: '600' },
  scenarioRow: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  scenarioImage: { width: 94, height: 62, borderRadius: 11 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  input: { flex: 1, minWidth: 0, minHeight: 42, maxHeight: 110, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, fontSize: 15 },
});
