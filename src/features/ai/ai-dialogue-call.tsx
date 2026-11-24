import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import { StudyActionButton, StudyIconButton } from '@/components/ui/study-screen';
import { env } from '@/core/config/env';
import { aiIcons, type AiLine, type AiScenario } from '@/features/ai/ai-catalog';
import { AiAvatar, AiJapanese, scenarioArt } from '@/features/ai/ai-ui';
import { callTime } from '@/features/ai/use-ai-workspace';
import { getVoiceOrigin } from '@/features/practice/services/voice-origin';

const wave = [6, 14, 9, 21, 11, 29, 15, 42, 57, 34, 17, 28, 11, 19, 12, 6];

type CallControlsProps = {
  paused: boolean;
  recording: boolean;
  busy: boolean;
  playing: boolean;
  end: () => void;
  pause: () => void;
  record: () => void;
  listen: () => void;
};

type AiDialogueCallProps = CallControlsProps & {
  scene: AiScenario;
  prompt: AiLine;
  seconds: number;
  error: string;
  close: () => void;
  sample?: () => void;
};

export function AiDialogueCall({
  scene, prompt, seconds, error, close, sample, paused, recording, busy, playing, end, listen, pause, record,
}: AiDialogueCallProps) {
  return (
    <View style={styles.callScene}>
      <Image source={scenarioArt[scene.id]} contentFit="cover" blurRadius={24} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.scrim} />
      <View style={styles.callHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Thoát cuộc gọi" onPress={close}
          style={styles.closeCall}><Text style={styles.closeGlyph}>×</Text></Pressable>
        <View style={styles.center}>
          <Text accessibilityRole="header" style={styles.callTitle}>Cuộc gọi với AI</Text>
          <Text style={styles.callLabel}>{scene.title} · {callTime(seconds)}</Text>
        </View>
        <View style={styles.callHeaderSpacer} />
      </View>
      <ScrollView style={styles.fill} contentContainerStyle={styles.callBody}>
        <View style={styles.ringOuter}><View style={styles.ringInner}><AiAvatar size={132} /></View></View>
        <View style={styles.callBubble}>
          <Text style={styles.callRole}>AI · {scene.role}</Text>
          <View style={styles.row}>
            <View style={styles.fill}><AiJapanese text={prompt.japanese} furigana color="#152234" /></View>
            <StudyIconButton icon={playing ? aiIcons.stop : aiIcons.listen} label="Nghe câu tiếng Nhật"
              size={34} disabled={paused || recording || busy}
              onPress={listen} />
          </View>
          {!!prompt.vietnamese && <Text style={styles.callTranslation}>{prompt.vietnamese}</Text>}
        </View>
        <CallWave active={playing || recording} paused={paused} />
        {sample && <StudyActionButton label="Dùng câu mẫu" secondary disabled={paused || recording || busy}
          onPress={sample} />}
        {!env.demoMode && !getVoiceOrigin() && <Text style={styles.callLabel}>Dịch vụ nhận diện giọng nói chưa được cấu hình.</Text>}
        {!!error && <Text style={styles.callLabel}>{error}</Text>}
      </ScrollView>
      <CallControls paused={paused} recording={recording} busy={busy} playing={playing}
        end={end} listen={listen} pause={pause} record={record} />
    </View>
  );
}

function CallWave({ active, paused }: { active: boolean; paused: boolean }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]));
    animation.start();
    return () => { animation.stop(); pulse.setValue(0); };
  }, [active, pulse]);
  return (
    <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {wave.map((height, index) => <Animated.View key={index} style={[styles.bar, {
        height, opacity: paused ? 0.3 : 0.88,
        transform: [{ scaleY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.56, 0.78 + index % 3 * 0.16] }) }],
      }]} />)}
    </View>
  );
}

function CallControls({ paused, recording, busy, playing, end, pause, record, listen }: CallControlsProps) {
  return (
    <View style={styles.callControls}>
      <View style={styles.center}><StudyIconButton icon={playing ? aiIcons.stop : aiIcons.listen}
        label={playing ? 'Dừng đọc' : 'Nghe lời thoại'} size={51} disabled={paused || recording || busy} onPress={listen} />
        <Text style={styles.callLabel}>Loa</Text>
      </View>
      <View style={styles.center}><StudyIconButton icon={paused ? aiIcons.play : aiIcons.pause}
        label={paused ? 'Tiếp tục' : 'Tạm dừng'} size={51} disabled={recording || busy} onPress={pause} />
        <Text style={styles.callLabel}>{paused ? 'Tiếp tục' : 'Tạm dừng'}</Text>
      </View>
      <View style={styles.center}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kết thúc cuộc gọi" disabled={recording || busy} onPress={end}
          style={({ pressed }) => [styles.endCall, { opacity: pressed || recording || busy ? 0.55 : 1 }]}>
          <StudyIcon name={aiIcons.end} size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.callLabel}>Kết thúc</Text>
      </View>
      <View style={styles.center}><StudyIconButton icon={recording ? aiIcons.stop : aiIcons.mic} primary={recording} size={51}
        label={recording ? 'Dừng ghi âm' : 'Bật micro'} disabled={paused || (busy && !recording)} onPress={record} />
        <Text style={styles.callLabel}>{recording ? 'Đang ghi' : 'Mic'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fill: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center', gap: 5 },
  callScene: { flex: 1, overflow: 'hidden', paddingHorizontal: 17, backgroundColor: '#415D80' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#162C4FA6' },
  callHeader: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  closeCall: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { color: '#FFFFFF', fontSize: 24, lineHeight: 28 },
  callHeaderSpacer: { width: 39 },
  callTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  callLabel: { color: '#FFFFFF', fontSize: 13, textAlign: 'center' },
  callBody: { flexGrow: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 10, gap: 12 },
  ringOuter: { borderRadius: 104, borderWidth: 1, borderColor: '#86C0FF7A', padding: 15, backgroundColor: '#74B8FF15' },
  ringInner: { borderRadius: 84, borderWidth: 1, borderColor: '#C8E5FFB0', padding: 10, backgroundColor: '#8FB9E547' },
  callBubble: { width: '100%', borderRadius: 21, padding: 14, gap: 6, backgroundColor: '#F3F7FCEB' },
  callRole: { color: '#245E98', fontSize: 12, fontWeight: '700' },
  callTranslation: { color: '#324258', fontSize: 14, lineHeight: 20 },
  wave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 56 },
  bar: { width: 3, borderRadius: 4, backgroundColor: '#E8E6FF' },
  callControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 12, paddingBottom: 18 },
  endCall: { width: 51, height: 51, borderRadius: 26, backgroundColor: '#D9363E', alignItems: 'center', justifyContent: 'center' },
});
