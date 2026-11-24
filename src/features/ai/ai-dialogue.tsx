import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyPanel, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { env } from '@/core/config/env';
import { aiIcons, scenarios, type AiLine, type AiScenario } from '@/features/ai/ai-catalog';
import { AiDialogueCall } from '@/features/ai/ai-dialogue-call';
import { DialogueFeedback, DialogueResult } from '@/features/ai/ai-dialogue-results';
import { AiTopicRow, scenarioArt, splitAiLine, withoutReading } from '@/features/ai/ai-ui';
import { aiMessage, useAiWorkspace, type AiCall } from '@/features/ai/use-ai-workspace';
import { streamPracticeChat, type ChatTurn } from '@/features/practice/services/study-tools-service';
import { useSpeakingRecorder } from '@/features/speaking/use-speaking-recorder';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

export function dialogueHref(scene: AiScenario, threadId?: string) {
  return { pathname: '/practice/ai-dialogue/[scenarioId]' as const, params: { scenarioId: scene.id, ...(threadId ? { threadId, call: '1' } : {}) } };
}

export function AiDialogueLibrary() {
  const router = useRouter();
  return (
    <StudyScreen title="AI Đối thoại" back="/practice/chat">
      <StudyText>Luyện nói với AI theo tình huống thực tế và xem góp ý sau từng lượt.</StudyText>
      <StudyText heading>Chọn tình huống</StudyText>
      <View style={styles.list}>
        {scenarios.map((scene) => <AiTopicRow key={scene.id} title={scene.title} subtitle={scene.level + ' · ' + scene.duration}
          image={scenarioArt[scene.id]} icon={scene.icon} onPress={() => router.push(dialogueHref(scene))} />)}
      </View>
    </StudyScreen>
  );
}

export function AiDialogueScreen() {
  const { scenarioId, call, threadId } = useLocalSearchParams<{ scenarioId?: string; call?: string; threadId?: string }>();
  const scene = scenarios.find((item) => item.id === scenarioId);
  return scene ? <DialogueSession key={scene.id + (threadId ?? '')} scene={scene} threadId={threadId} immediate={call === '1'} />
    : <StudyScreen title="AI Đối thoại" back="/practice/ai-dialogue"><StudyText>Không tìm thấy tình huống.</StudyText></StudyScreen>;
}

type Spoken = { text: string; score: number; uri?: string };

function DialogueSession({ scene, threadId, immediate }: { scene: AiScenario; threadId?: string; immediate: boolean }) {
  const router = useRouter();
  const workspace = useAiWorkspace();
  const recorder = useSpeakingRecorder();
  const [phase, setPhase] = useState<'preview' | 'call' | 'feedback' | 'result'>(immediate ? 'call' : 'preview');
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [turns, setTurns] = useState<Spoken[]>([]);
  const [index, setIndex] = useState(0);
  const [prompt, setPrompt] = useState<AiLine>(scene.opening);
  const [nextReply, setNextReply] = useState<AiLine>();
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<AiCall>();
  const speaker = useStudySpeech([withoutReading(prompt.japanese)]);
  const request = useRef<AbortController | null>(null);
  const finished = useRef(false);
  const round = scene.rounds[index];
  const recent = turns.at(-1);
  const back = threadId
    ? { pathname: '/practice/chat/[threadId]' as const, params: { threadId } }
    : '/practice/ai-dialogue' as const;

  useFocusEffect(useCallback(() => () => request.current?.abort(), []));
  useEffect(() => {
    if (phase !== 'call' || paused) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [phase, paused]);

  function start() {
    finished.current = false;
    setPhase('call');
    setPaused(false);
    setSeconds(0);
    setTurns([]);
    setIndex(0);
    setPrompt(scene.opening);
    setHistory([]);
    setNextReply(undefined);
    setError('');
    setSummary(undefined);
  }

  async function respond(spoken: Spoken) {
    if (request.current || !round || !spoken.text.trim()) return;
    speaker.stop();
    const next = turns.concat(spoken);
    const sceneHistory: ChatTurn[] = history.length ? history : [
      { role: 'assistant', content: aiMessage(scene.opening.japanese, scene.opening.vietnamese) },
    ];
    setTurns(next);
    setNextReply(round.reply);
    setPhase('feedback');
    setError('');
    if (env.demoMode) return;

    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 75_000);
    setWaiting(true);
    let full = '';
    try {
      await streamPracticeChat(spoken.text.slice(0, 1500), scene.level, sceneHistory.slice(-12),
        controller.signal, (chunk) => { full += chunk; }, { scenario: scene.id, includeTranslation: true });
      if (full.trim() && !controller.signal.aborted) {
        setNextReply(splitAiLine(full));
        setHistory(sceneHistory.concat({ role: 'user', content: spoken.text }, { role: 'assistant', content: full.slice(0, 3000) }));
      }
    } catch {
      if (!controller.signal.aborted) setError('AI chưa phản hồi. Tiếp tục với câu mẫu của tình huống.');
    } finally {
      clearTimeout(timeout);
      request.current = null;
      setWaiting(false);
    }
  }

  function finish() {
    if (finished.current) return;
    finished.current = true;
    speaker.stop();
    request.current?.abort();
    const best = [...turns].sort((a, b) => b.score - a.score)[0];
    const average = turns.length ? Math.round(turns.reduce((sum, turn) => sum + turn.score, 0) / turns.length) : 0;
    const result: AiCall = {
      id: scene.id + '-' + Date.now().toString(36), duration: seconds, title: scene.title, average, turns: turns.length,
      best: best?.text ?? '', tip: 'Nghe lại câu mẫu và thử nói chậm từng cụm.',
    };
    setSummary(result);
    setPhase('result');
    if (threadId && workspace.data?.threads.some((thread) => thread.id === threadId)) {
      void workspace.save((current) => ({
        ...current, threads: current.threads.map((thread) => thread.id === threadId
          ? { ...thread, updatedAt: new Date().toISOString(), calls: [result, ...(thread.calls ?? [])].slice(0, 6) } : thread),
      })).then(() => router.dismissTo(back)).catch(() => setError('Chưa lưu được tóm tắt vào cuộc trò chuyện.'));
    }
  }

  if (phase === 'preview') return (
    <StudyScreen title={scene.title} back={back} footer={<StudyActionButton label="Bắt đầu luyện nói" icon={aiIcons.play} onPress={start} />}>
      <View style={styles.cover}>
        <Image source={scenarioArt[scene.id]} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.coverCaption}><Text style={styles.coverTitle}>{scene.title}</Text></View>
      </View>
      <StudyText>{scene.description}</StudyText>
      <View style={styles.row}>
        {[['Cấp độ', scene.level], ['Thời lượng', scene.duration], ['Kỹ năng', 'Nói · Nghe']].map(([label, value]) => (
          <StudyPanel key={label} style={styles.fill}><StudyText>{label}</StudyText><StudyText heading>{value}</StudyText></StudyPanel>
        ))}
      </View>
      <StudyPanel><StudyText heading>Mục tiêu</StudyText>{scene.objectives.map((objective) => <Objective key={objective} text={objective} />)}</StudyPanel>
    </StudyScreen>
  );
  if (phase === 'feedback' && recent) return (
    <DialogueFeedback spoken={recent} scene={scene} busy={waiting} error={error}
      next={() => {
        if (waiting) return;
        if (index + 1 >= scene.rounds.length) { finish(); return; }
        setIndex(index + 1);
        setPrompt(nextReply ?? round.reply);
        setNextReply(undefined);
        setPhase('call');
      }} />
  );
  if (phase === 'result' && summary) {
    return <DialogueResult summary={summary} back={back} error={error} saving={workspace.saving}
      doneLabel={threadId ? 'Về AI Chat' : 'Chọn tình huống khác'}
      done={() => router.dismissTo(back)} restart={start} />;
  }

  return (
    <AiDialogueCall scene={scene} prompt={prompt} seconds={seconds} paused={paused} recording={recorder.isRecording}
      busy={recorder.busy} playing={speaker.playing} error={recorder.error} close={() => router.dismissTo(back)}
      sample={env.demoMode ? () => { if (round) void respond({ text: round.answer, score: 90 - index * 2 }); } : undefined}
      end={finish} listen={() => speaker.playing ? speaker.stop() : void speaker.play(0)}
      pause={() => { speaker.stop(); setPaused((value) => !value); }}
      record={() => { speaker.stop(); if (round) void recorder.toggle(round.answer, (spoken) => void respond(spoken)); }} />
  );
}

function Objective({ text }: { text: string }) {
  const colors = useStudyColors();
  return <View style={styles.row}><StudyIcon name={aiIcons.check} size={17} color={colors.icon} /><StudyText>{text}</StudyText></View>;
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fill: { flex: 1, minWidth: 0 },
  cover: { aspectRatio: 2.2, borderRadius: 19, overflow: 'hidden', justifyContent: 'flex-end' },
  coverCaption: { padding: 12, backgroundColor: '#162D4C8A' },
  coverTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
