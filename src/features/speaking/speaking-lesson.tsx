import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { JapaneseSpeech } from '@/components/ui/japanese-speech';
import { VideoFrame } from '@/components/ui/lesson-video-controls';
import { LessonVideo } from '@/components/ui/lesson-media';
import { StudyAudio } from '@/components/ui/study-audio';
import { StudyLinkRow } from '@/components/ui/study-navigation';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { env } from '@/core/config/env';
import { getVoiceOrigin } from '@/features/practice/services/voice-origin';
import { transcriptScore } from '@/features/practice/data/transcript-score';
import { speakingLessons, speakingModes, type SpeakingLesson, type SpeakingMode } from '@/features/speaking/lessons';
import { speakingIcons, speakingLessonHref } from '@/features/speaking/speaking-browser';
import { speakingScore, useSpeakingProgress, type SpeakingAttempt } from '@/features/speaking/use-speaking-progress';
import { useSpeakingRecorder } from '@/features/speaking/use-speaking-recorder';
import { demoVideo } from '@/integrations/demo/demo-data';
import { useDeviceBookmark } from '@/shared/hooks/use-device-bookmark';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

const presets = ['Chỉ tiếng Nhật', 'Nhật + Dịch', 'Nhật + Furigana'] as const;
const descriptions = ['Nghe và nhại theo ngay lập tức', 'Nghe từng câu rồi lặp lại', 'Thực hành lời thoại của nhân vật', 'Nghe rồi nhập lại câu tiếng Nhật'];
const sizes = ['A−', 'A', 'A+'] as const;
type Captions = { japanese: boolean; reading: boolean; translation: boolean; position: 'Dưới video' | 'Trong video'; size: typeof sizes[number] };
type LineResult = { text: string; score: number; uri?: string };
const defaults: Captions = { japanese: true, reading: false, translation: true, position: 'Dưới video', size: 'A' };
const patternExamples = [
  { term: '〜は〜です', reading: '〜は〜です', meaning: 'Dùng để giới thiệu hoặc nhận định.' },
  { term: '〜から来ました', reading: '〜からきました', meaning: 'Dùng khi nói mình đến từ đâu.' },
  { term: '〜を勉強しています', reading: '〜をべんきょうしています', meaning: 'Dùng khi nói về môn đang học.' },
];

export function SpeakingLessonScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; mode?: string; attemptId?: string }>();
  const lesson = speakingLessons.find((item) => item.id === params.lessonId);
  const progress = useSpeakingProgress();
  const saved = progress.attempts.find((attempt) => attempt.id === params.attemptId && attempt.lessonId === lesson?.id);
  const mode = saved?.mode ?? speakingModes.find((item) => item === params.mode) ?? 'Shadowing';
  if (params.attemptId && !progress.ready) {
    return <StudyScreen title="Kết quả" back="/practice/speaking/stats">
      <StudyText>{progress.failed ? 'Không đọc được lịch sử trên thiết bị.' : 'Đang tải kết quả…'}</StudyText>
    </StudyScreen>;
  }
  return lesson ? <LessonFlow key={lesson.id + ':' + mode + ':' + params.attemptId} lesson={lesson} initialMode={mode} saved={saved} />
    : <StudyScreen title="Luyện nói" back="/practice/speaking/library"><StudyText>Không tìm thấy bài luyện.</StudyText></StudyScreen>;
}

function LessonFlow({ lesson, initialMode, saved }: { lesson: SpeakingLesson; initialMode: SpeakingMode; saved?: SpeakingAttempt }) {
  const router = useRouter();
  const [screen, setScreen] = useState<'preview' | 'captions' | 'modes' | 'practice' | 'result' | 'report' | 'vocabulary'>(saved ? 'result' : 'preview');
  const [captions, changeCaptions] = useState(defaults);
  const [mode, setMode] = useState(initialMode);
  const [index, selectLine] = useState(0);
  const [results, setResults] = useState<(LineResult | null)[]>(saved?.lines ?? []);
  const [attempt, setAttempt] = useState<SpeakingAttempt | undefined>(saved);
  const [draft, setDraft] = useState('');
  const [videoLine, setVideoLine] = useState<number>();
  const [startedAt, setStartedAt] = useState(0);
  const speech = useStudySpeech(lesson.lines.map((line) => line.speakText));
  const recorder = useSpeakingRecorder();
  const progress = useSpeakingProgress();
  const bookmark = useDeviceBookmark('speaking.' + lesson.id);
  const line = lesson.lines[index];
  const previewIndex = videoLine ?? speech.index;
  const previewLine = lesson.lines[previewIndex];
  const selectPreviewLine = (index: number) => { setVideoLine(undefined); speech.select(index); };
  const library = { pathname: '/practice/speaking/library' as const, params: { level: lesson.level, mode } };
  const go = (next: typeof screen) => { speech.stop(); setScreen(next); };
  const audio = () => speech.play(screen === 'practice' ? index : previewIndex);
  const outcome = typeof attempt === 'undefined' ? null : speakingScore(attempt);

  function start() {
    setAttempt(undefined);
    setDraft('');
    setResults([]);
    selectLine(0);
    setStartedAt(Date.now());
    go('practice');
  }

  function finish(next: (LineResult | null)[]) {
    const completed: SpeakingAttempt = {
      id: lesson.id + '-' + startedAt, lessonId: lesson.id, mode, createdAt: new Date().toISOString(),
      seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      lines: next.map((item) => item ? { text: item.text, score: item.score } : null),
    };
    if (next.some(Boolean) && progress.ready) progress.save(completed);
    setAttempt(completed);
    go('result');
  }

  function nextLine(value: LineResult | null, end = false) {
    const next = [...results, value];
    setResults(next);
    setDraft('');
    if (end || index + 1 === lesson.lines.length) finish(next);
    else { speech.stop(); selectLine(index + 1); }
  }

  if (screen === 'captions') return (
    <StudyScreen title="Hiển thị phụ đề" back={library} onBack={() => go('preview')}>
      <SpeakingPreview lesson={lesson} overlay={captions.position === 'Trong video' ? <Caption line={previewLine} captions={captions} overlay /> : undefined}
        onPlay={() => void speech.play(0, { through: true })} />
      {captions.position === 'Dưới video' && <Caption line={previewLine} captions={captions} />}
      <StudyPanel>
        <CaptionSwitch label="Hiển thị tiếng Nhật" value={captions.japanese} change={(japanese) => changeCaptions({ ...captions, japanese })} />
        <CaptionSwitch label="Hiển thị Furigana" value={captions.reading} change={(reading) => changeCaptions({ ...captions, reading })} />
        <CaptionSwitch label="Hiển thị bản dịch" value={captions.translation} change={(translation) => changeCaptions({ ...captions, translation })} />
      </StudyPanel>
      <StudyText heading>Kiểu hiển thị</StudyText>
      <StudyPills options={['Dưới video', 'Trong video']} current={captions.position} onSelect={(position) => changeCaptions({ ...captions, position })} />
      <StudyText heading>Cỡ chữ</StudyText>
      <StudyPills options={[...sizes]} current={captions.size} onSelect={(size) => changeCaptions({ ...captions, size })} />
    </StudyScreen>
  );

  if (screen === 'modes') return (
    <StudyScreen title="Chế độ luyện tập" back={library} onBack={() => go('preview')}
      footer={<StudyActionButton label="Bắt đầu luyện tập" icon={speakingIcons.play} onPress={start} />}>
      {speakingModes.map((item, index) => <StudyLinkRow key={item} title={item} subtitle={descriptions[index]}
        icon={[speakingIcons.play, speakingIcons.mic, speakingIcons.role, speakingIcons.word][index]}
        end={mode === item ? <StudyText>✓</StudyText> : undefined} onPress={() => setMode(item)} />)}
    </StudyScreen>
  );

  if (screen === 'vocabulary') return <LessonVocabulary lesson={lesson} back={() => go('preview')} />;

  const nextLesson = speakingLessons.slice(speakingLessons.indexOf(lesson) + 1).find((item) => item.level === lesson.level);
  if (screen === 'result' && attempt && outcome !== null) return (
    <StudyScreen title="Kết quả" back={saved ? "/practice/speaking/stats" : library} onBack={saved ? undefined : () => go('preview')}
      footer={<View style={styles.row}>
        <View style={styles.flex}><StudyActionButton label="Luyện lại" secondary onPress={start} /></View>
        <View style={styles.flex}><StudyActionButton label={nextLesson ? 'Tiếp bài sau' : 'Chọn bài khác'}
          onPress={() => nextLesson ? router.replace(speakingLessonHref(nextLesson)) : router.dismissTo(library)} /></View>
      </View>}>
      <View style={styles.center}><StudyRing progress={outcome / 100} size={138}><StudyText heading>{outcome} / 100</StudyText><StudyText>{outcome >= 80 ? 'Rất tốt!' : 'Tiếp tục luyện nhé'}</StudyText></StudyRing></View>
      <StudyPanel><StudyText heading>{mode === 'Nghe viết' ? 'Độ khớp câu đã nhập' : 'Độ khớp bản phiên âm'}</StudyText>
        <StudyText>{outcome} / 100</StudyText><StudyProgressBar fraction={outcome / 100} /></StudyPanel>
      <StudyPanel><StudyText heading>Gợi ý luyện tập</StudyText><StudyText>{outcome >= 80
        ? 'Nghe lại câu mẫu và thử nhại theo với tốc độ tự nhiên.' : 'Nghe chậm từng câu, chia thành cụm ngắn rồi luyện lại.'}</StudyText></StudyPanel>
      <StudyLinkRow title="Phân tích chi tiết" icon={speakingIcons.chart} onPress={() => go('report')} />
      {env.demoMode && mode !== 'Nghe viết' && (
        <StudyPanel>
          <StudyText heading>Phân tích mẫu</StudyText>
          {demoMetrics(outcome).map(({ label, value }) => <View key={label} style={styles.row}>
            <View style={styles.flex}><StudyText>{label}</StudyText></View><StudyText heading>{value} / 100</StudyText>
          </View>)}
          <StudyText>Chỉ số nhận diện giả lập trong bản demo.</StudyText>
        </StudyPanel>
      )}
      {progress.failed && <StudyText>Chưa lưu được lượt luyện trên thiết bị.</StudyText>}
    </StudyScreen>
  );

  if (screen === 'report') return <LessonReport lesson={lesson} results={results} back={() => go('result')} />;

  if (screen === 'practice') return (
    <StudyScreen title={mode === 'Shadowing' ? 'Luyện Shadowing' : mode} back={library}
      onBack={() => { if (!recorder.isRecording && !recorder.busy) go('modes'); }}
      footer={<View style={styles.row}>
        <View style={styles.flex}><StudyActionButton label="Bỏ qua" secondary disabled={recorder.isRecording || recorder.busy} onPress={() => nextLine(null)} /></View>
        <View style={styles.flex}><StudyActionButton label="Kết thúc" secondary disabled={!results.some(Boolean) || recorder.isRecording || recorder.busy} onPress={() => finish(results)} /></View>
      </View>}>
      <View style={styles.row}><StudyText heading>{index + 1} / {lesson.lines.length}</StudyText><StudyProgressBar fraction={index / lesson.lines.length} style={styles.flex} /></View>
      <SpeakingPreview lesson={lesson} onPlay={() => { if (!recorder.isRecording) void audio(); }} />
      {mode === 'Nghe viết' ? <Dictation draft={draft} setDraft={setDraft} check={() => nextLine({ text: draft, score: transcriptScore(line.speakText, draft) })} />
        : <Caption line={line} captions={captions} />}
      {mode === 'Nhập vai' && <StudyText>{index % 2 === 0 ? 'Vai A · Mở đầu' : 'Vai B · Đáp lời'}</StudyText>}
      {mode !== 'Nghe viết' && <>
        <View style={styles.center}>
          <StudyIconButton icon={recorder.isRecording ? speakingIcons.stop : speakingIcons.mic}
            label={recorder.isRecording ? 'Dừng ghi âm và chấm câu' : 'Ghi âm'} primary size={66} disabled={recorder.busy && !recorder.isRecording}
            onPress={() => { speech.stop(); void recorder.toggle(line.japanese, nextLine); }} />
          <StudyText>{recorder.isRecording ? 'Đang ghi · ' + recorder.seconds + ' giây' : recorder.busy ? 'Đang nhận diện…' : 'Nhấn để ghi âm'}</StudyText>
        </View>
        {recorder.error && <StudyText>{recorder.error}</StudyText>}
        {!getVoiceOrigin() && <StudyText>Cần kết nối dịch vụ nhận diện để chấm bản ghi âm.</StudyText>}
      </>}
    </StudyScreen>
  );

  return (
    <StudyScreen title={'Shadowing · ' + lesson.japaneseTitle} back={library} action={
      <StudyIconButton icon={speakingIcons.word} label={bookmark.saved ? 'Bỏ lưu bài' : 'Lưu bài'}
        selected={bookmark.saved} disabled={!bookmark.enabled} onPress={bookmark.toggle} />
    } footer={<StudyActionButton label="Chọn chế độ luyện" icon={speakingIcons.play} onPress={() => go('modes')} />}>
      <SpeakingPreview lesson={lesson} withVideo onPlay={() => void speech.play(previewIndex, { through: true })}
        onTime={(seconds) => setVideoLine(seconds < 1.7 ? 0 : seconds < 3.7 ? 1 : seconds < 5.3 ? 2 : 3)}
        overlay={captions.position === 'Trong video' ? <Caption line={previewLine} captions={captions} overlay /> : undefined} />
      <View style={styles.row}>
        <StudyIconButton icon={speakingIcons.back} label="Câu trước" disabled={previewIndex === 0} onPress={() => selectPreviewLine(previewIndex - 1)} />
        <View style={styles.flex}>{captions.position === 'Dưới video' && <Caption line={previewLine} captions={captions} />}</View>
        <StudyIconButton icon={speakingIcons.next} label="Câu tiếp theo" disabled={previewIndex + 1 === lesson.lines.length} onPress={() => selectPreviewLine(previewIndex + 1)} />
      </View>
      <StudyPills options={[...presets]} current={captions.translation ? presets[1] : captions.reading ? presets[2] : presets[0]}
        onSelect={(preset) => changeCaptions({ ...captions, japanese: true, reading: preset === presets[2], translation: preset === presets[1] })} />
      <View style={styles.playControls}>
        <StudyIconButton icon={speakingIcons.settings} label="Cài đặt phụ đề" onPress={() => go('captions')} />
        <StudyIconButton icon={speech.playing ? speakingIcons.pause : speakingIcons.play}
          label={speech.playing ? 'Dừng nghe mẫu' : 'Nghe mẫu'} primary size={58} onPress={() => speech.playing ? speech.stop() : void audio()} />
        <StudyIconButton icon={speakingIcons.word} label="Từ vựng và mẫu câu" onPress={() => go('vocabulary')} />
      </View>
      {speech.failed && <StudyText>Chưa phát được giọng đọc tiếng Nhật trên thiết bị.</StudyText>}
    </StudyScreen>
  );
}

function SpeakingPreview({ lesson, withVideo, overlay, onPlay, onTime }: {
  lesson: SpeakingLesson; withVideo?: boolean; overlay?: React.ReactNode; onPlay: () => void; onTime?: (seconds: number) => void;
}) {
  const colors = useStudyColors();
  return withVideo && env.demoMode && lesson.id === 'gioi-thieu' ? (
    <View><LessonVideo url={demoVideo} colors={colors} onTimeUpdate={onTime} />{overlay}</View>
  ) : <VideoFrame colors={colors} onPlay={onPlay} label="Nghe đoạn mẫu" overlay={overlay} />;
}

function Caption({ line, captions, overlay }: { line: SpeakingLesson['lines'][number]; captions: Captions; overlay?: boolean }) {
  const colors = useStudyColors();
  const fontSize = captions.size === 'A−' ? 18 : captions.size === 'A+' ? 28 : 23;
  return <View pointerEvents="none" style={[styles.caption, overlay && styles.overlay, overlay && { backgroundColor: colors.surface }]}>
    {captions.reading && line.reading && <StudyText>{line.reading}</StudyText>}
    {captions.japanese && <Text selectable style={[styles.japanese, { color: colors.blue, fontSize }]}>{line.japanese}</Text>}
    {captions.translation && <StudyText>{line.meaning}</StudyText>}
  </View>;
}

function CaptionSwitch({ label, value, change }: { label: string; value: boolean; change: (value: boolean) => void }) {
  const colors = useStudyColors();
  return <View style={styles.row}><View style={styles.flex}><StudyText>{label}</StudyText></View>
    <Switch accessibilityLabel={label} value={value} onValueChange={change} trackColor={{ true: colors.blue }} /></View>;
}

function Dictation({ draft, setDraft, check }: { draft: string; setDraft: (value: string) => void; check: () => void }) {
  const colors = useStudyColors();
  return <StudyPanel><StudyText heading>Nghe và nhập lại câu</StudyText>
    <TextInput accessibilityLabel="Câu bạn nghe được" value={draft} onChangeText={setDraft} placeholder="Nhập câu tiếng Nhật…"
      placeholderTextColor={colors.secondary} multiline style={{ minHeight: 72, color: colors.text }} />
    <StudyActionButton label="Kiểm tra câu" disabled={!draft.trim()} onPress={check} /></StudyPanel>;
}

function LessonVocabulary({ lesson, back }: { lesson: SpeakingLesson; back: () => void }) {
  const [tab, setTab] = useState<'Từ vựng' | 'Mẫu câu'>('Từ vựng');
  return <StudyScreen title="Từ vựng & Mẫu câu" back="/practice/speaking" onBack={back}>
    <StudyPills options={['Từ vựng', 'Mẫu câu']} current={tab} onSelect={setTab} />
    {(tab === 'Từ vựng' ? lesson.words : lesson.id === 'gioi-thieu' ? patternExamples : lesson.lines.map((line) => ({
      term: line.japanese, reading: line.reading ?? line.speakText, meaning: line.meaning,
    }))).map(({ term, reading, meaning }) => <StudyPanel key={term}>
      <StudyText heading>{term}</StudyText><StudyText>{reading} · {meaning}</StudyText><JapaneseSpeech text={term} />
    </StudyPanel>)}
  </StudyScreen>;
}

function LessonReport({ lesson, results, back }: { lesson: SpeakingLesson; results: (LineResult | null)[]; back: () => void }) {
  const [tab, setTab] = useState<'Từng câu' | 'Tổng quan'>('Từng câu');
  const [active, select] = useState(0);
  const result = results[active];
  const lowest = results.reduce<number>((best, item, index) => (item?.score ?? 0) < (results[best]?.score ?? 0) ? index : best, 0);
  return <StudyScreen title="Phân tích chi tiết" back="/practice/speaking" onBack={back}>
    <StudyPills options={['Từng câu', 'Tổng quan']} current={tab} onSelect={setTab} />
    {tab === 'Từng câu' ? <>
      {results.map((result, index) => <StudyLinkRow key={lesson.lines[index].id} title={lesson.lines[index].japanese}
        subtitle={result ? result.score + ' / 100' : 'Đã bỏ qua'} icon={speakingIcons.play} onPress={() => select(index)} />)}
      {lesson.lines[active] && <StudyPanel>
        <StudyText heading>{lesson.lines[active].japanese}</StudyText>
        {result && <StudyText>{result.text}</StudyText>}
        <JapaneseSpeech text={lesson.lines[active].speakText} />
        {result?.uri && <StudyAudio url={result.uri} />}
      </StudyPanel>}
    </> : <StudyPanel><StudyText heading>Câu nên luyện lại</StudyText><StudyText>{lesson.lines[lowest]?.japanese}</StudyText>
      <StudyText>Nghe mẫu và đọc lại từng cụm, sau đó ghép thành một câu.</StudyText>
      {lesson.lines[lowest] && <JapaneseSpeech text={lesson.lines[lowest].speakText} />}
    </StudyPanel>}
  </StudyScreen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  center: { alignItems: 'center', gap: 8, padding: 10 },
  caption: { alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 83, paddingHorizontal: 8 },
  japanese: { fontWeight: '800', textAlign: 'center' },
  overlay: { position: 'absolute', bottom: 42, left: 12, right: 12, minHeight: 53, borderRadius: 14 },
  playControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
});

export function demoMetrics(score: number) {
  return [
    { label: 'Phát âm', value: Math.min(100, score + 2) },
    { label: 'Độ trôi chảy', value: Math.max(0, score - 1) },
    { label: 'Nhịp điệu', value: Math.max(0, score - 2) },
  ];
}
