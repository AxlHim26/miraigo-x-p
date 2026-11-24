import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { StudyIcon } from '@/components/ui/study-icon';
import {
  ListeningActionButton, ListeningFrame, ListeningIconButton, ListeningPanel, ListeningPills, ListeningProgressBar,
  ListeningText, listeningCovers, listeningIcons, useListeningColors,
} from '@/features/listening/components/listening-ui';
import { findListeningLesson, listeningTitle, type ListeningLesson } from '@/features/listening/data/listening-lessons';
import { useListeningProgress } from '@/features/listening/hooks/use-listening-progress';
import { useStudySpeech } from '@/shared/hooks/use-study-speech';

const tabs = ['Nội dung', 'Từ vựng', 'Câu hỏi', 'Transcript'] as const;
const rates = [1, 0.75, 1.25];

export function ListeningLessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = findListeningLesson(lessonId);
  const study = useListeningProgress();

  if (!lesson || (!study.ready && !study.readError)) {
    return (
      <ListeningFrame title="Bài nghe" back="/practice/listening">
        <ListeningPanel><ListeningText>{lesson ? 'Đang tải bài nghe…' : 'Không tìm thấy bài nghe.'}</ListeningText></ListeningPanel>
      </ListeningFrame>
    );
  }
  return <LessonContent key={lesson.id} lesson={lesson} study={study} />;
}

function LessonContent({ lesson, study }: { lesson: ListeningLesson; study: ReturnType<typeof useListeningProgress> }) {
  const { record, ready, progress } = study;
  const status = progress.lessons[lesson.id];
  const [tab, setTab] = useState<typeof tabs[number]>('Nội dung');
  const [rate, setRate] = useState(rates[0]);
  const [repeat, setRepeat] = useState(false);
  const repeatValue = useRef(false);
  const speech = useStudySpeech(lesson.lines.map((line) => line.speakText), Math.min(status?.line ?? 0, lesson.lines.length - 1));
  const onLineDone = (index: number) => record({ type: 'heard', lesson, index });

  useFocusEffect(useCallback(() => {
    if (ready) record({ type: 'open', lesson });
  }, [lesson, ready, record]));

  const playLine = (index: number, through: boolean, nextRate = rate) =>
    void speech.play(index, { rate: nextRate, through, repeat: () => repeatValue.current, onLineDone });

  return (
    <ListeningFrame
      title={listeningTitle(lesson)}
      back="/practice/listening"
      restartKey={tab}
      action={<ListeningIconButton
        icon={status?.favorite ? listeningIcons.heartFill : listeningIcons.heart}
        label={status?.favorite ? 'Bỏ yêu thích bài nghe' : 'Yêu thích bài nghe'}
        selected={status?.favorite}
        disabled={!ready}
        onPress={() => record({ type: 'favorite', lesson })}
      />}>
      {tab === 'Nội dung' && (
        <Player
          lesson={lesson}
          speech={speech}
          repeat={repeat}
          rate={rate}
          changeRate={() => {
            const nextRate = rates[(rates.indexOf(rate) + 1) % rates.length];
            setRate(nextRate);
            if (speech.playing) playLine(speech.index, true, nextRate);
          }}
          toggleRepeat={() => {
            repeatValue.current = !repeatValue.current;
            setRepeat(repeatValue.current);
          }}
          playLine={(index) => playLine(index, true)}
        />
      )}
      <ListeningPills options={tabs} current={tab} onSelect={(next) => {
        if (next !== tab) speech.stop();
        setTab(next);
      }} />
      {tab === 'Nội dung' && <LessonOverview lesson={lesson} />}
      {tab === 'Transcript' && <Transcript lesson={lesson} speech={speech} playLine={(index) => playLine(index, false)} />}
      {tab === 'Từ vựng' && <LessonVocabulary lesson={lesson} />}
      {tab === 'Câu hỏi' && <LessonQuestions lesson={lesson} />}
      {speech.failed && <ListeningText>Thiết bị chưa phát được giọng tiếng Nhật.</ListeningText>}
      {study.saveError && <ListeningText>Chưa lưu được tiến độ luyện nghe trên thiết bị.</ListeningText>}
      {study.readError && <ListeningActionButton secondary label="Tải lại tiến độ" onPress={() => void study.retry()} />}
    </ListeningFrame>
  );
}

function Player({ lesson, speech, repeat, rate, changeRate, toggleRepeat, playLine }: {
  lesson: ListeningLesson;
  speech: ReturnType<typeof useStudySpeech>;
  repeat: boolean;
  rate: number;
  changeRate: () => void;
  toggleRepeat: () => void;
  playLine: (index: number) => void;
}) {
  const colors = useListeningColors();
  const [trackWidth, setTrackWidth] = useState(0);
  const length = lesson.lines.length;
  const index = speech.index;
  const fraction = (index + speech.fraction) / length;
  function jump(next: number) {
    if (next === index) return;
    if (speech.playing) playLine(next);
    else speech.select(next);
  }

  return (
    <View style={styles.player}>
      <View style={styles.cover}>
        <Image accessible={false} source={listeningCovers[lesson.cover]} contentFit="cover" style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.seekRow}>
        <Text style={[styles.meta, { color: colors.secondary }]}>Câu {index + 1}</Text>
        <View
          accessible accessibilityRole="adjustable" accessibilityLabel="Chọn vị trí trong bài nghe"
          accessibilityValue={{ min: 1, max: length, now: index + 1 }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => jump(Math.max(0, Math.min(length - 1, index + (event.nativeEvent.actionName === 'increment' ? 1 : -1))))}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => trackWidth > 0}
          onResponderRelease={(event) => jump(Math.max(0, Math.min(length - 1, Math.floor(event.nativeEvent.locationX / trackWidth * length))))}
          style={styles.seekTarget}>
          <View pointerEvents="none">
            <ListeningProgressBar fraction={fraction} />
            <View style={[styles.knob, { left: `${fraction * 100}%`, backgroundColor: colors.icon }]} />
          </View>
        </View>
        <Text style={[styles.meta, { color: colors.secondary }]}>{length} câu</Text>
      </View>
      <View style={styles.playerControls}>
        <ListeningIconButton icon={listeningIcons.repeat} label="Lặp lại bài nghe" selected={repeat} onPress={toggleRepeat} size={39} />
        <ListeningIconButton icon={listeningIcons.previousLine} label="Câu trước" onPress={() => jump(index - 1)} disabled={index === 0} size={39} />
        <ListeningIconButton primary icon={speech.playing ? listeningIcons.pause : listeningIcons.play}
          label={speech.playing ? 'Dừng phát' : 'Phát bài nghe'}
          onPress={speech.playing ? speech.stop : () => playLine(fraction >= 1 ? 0 : index)} size={57} />
        <ListeningIconButton icon={listeningIcons.nextLine} label="Câu tiếp theo" onPress={() => jump(index + 1)} disabled={index + 1 >= length} size={39} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Tốc độ ${rate} lần`} accessibilityHint="Bấm để đổi tốc độ"
          onPress={changeRate} style={({ pressed }) => [styles.speed, { backgroundColor: colors.surface, opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[styles.speedText, { color: colors.title }]}>{rate}×</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LessonOverview({ lesson }: { lesson: ListeningLesson }) {
  const colors = useListeningColors();
  return (
    <ListeningPanel>
      <View style={styles.overviewHeading}>
        <StudyIcon name={listeningIcons.transcript} color={colors.icon} size={17} />
        <ListeningText heading>Nội dung bài nghe</ListeningText>
      </View>
      <ListeningText>{lesson.description}</ListeningText>
      <View style={styles.badges}>
        {[lesson.level, `${lesson.lines.length} câu`, lesson.topic].map((label) => (
          <Text key={label} style={[styles.badge, { backgroundColor: colors.iconFill, color: colors.blue }]}>{label}</Text>
        ))}
      </View>
    </ListeningPanel>
  );
}

function Transcript({ lesson, speech, playLine }: {
  lesson: ListeningLesson;
  speech: ReturnType<typeof useStudySpeech>;
  playLine: (index: number) => void;
}) {
  const colors = useListeningColors();
  const [translation, setTranslation] = useState(true);
  return (
    <>
      <ListeningPanel style={styles.translate}>
        <Text style={[styles.translationTitle, { color: colors.title }]}>Hiện bản dịch</Text>
        <Switch accessibilityLabel="Hiện bản dịch" value={translation} onValueChange={setTranslation}
          thumbColor="#FFFFFF" trackColor={{ true: colors.icon, false: colors.track }} />
      </ListeningPanel>
      <View style={styles.lines}>
        {lesson.lines.map((line, index) => {
          const active = speech.playing && speech.index === index;
          return (
            <ListeningPanel key={line.id} style={styles.line}>
              <ListeningIconButton icon={active ? listeningIcons.pause : listeningIcons.play} label={active ? 'Dừng phát' : `Phát câu ${index + 1}`}
                onPress={active ? speech.stop : () => playLine(index)} size={37} />
              <View style={styles.lineCopy}>
                {line.reading && <Text style={[styles.reading, { color: colors.secondary }]}>{line.reading}</Text>}
                <Text selectable style={[styles.japanese, { color: colors.title }]}>{line.japanese}</Text>
                {translation && <Text selectable style={[styles.reading, { color: colors.secondary }]}>{line.meaning}</Text>}
              </View>
            </ListeningPanel>
          );
        })}
      </View>
    </>
  );
}

function LessonVocabulary({ lesson }: { lesson: ListeningLesson }) {
  const colors = useListeningColors();
  const speech = useStudySpeech(lesson.words.map((word) => word.term));
  return (
    <View style={styles.lines}>
      {lesson.words.map((word, index) => {
        const active = speech.playing && speech.index === index;
        return (
          <ListeningPanel key={word.term} style={styles.line}>
            <ListeningIconButton icon={active ? listeningIcons.pause : listeningIcons.play} label={active ? 'Dừng phát' : `Nghe từ ${word.term}`}
              onPress={active ? speech.stop : () => void speech.play(index)} size={37} />
            <View style={styles.lineCopy}>
              <Text selectable style={[styles.japanese, { color: colors.title }]}>{word.term}</Text>
              <Text selectable style={[styles.reading, { color: colors.secondary }]}>{word.reading} · {word.meaning}</Text>
            </View>
          </ListeningPanel>
        );
      })}
      {speech.failed && <ListeningText>Thiết bị chưa phát được giọng tiếng Nhật.</ListeningText>}
    </View>
  );
}

function LessonQuestions({ lesson }: { lesson: ListeningLesson }) {
  const router = useRouter();
  return (
    <ListeningPanel>
      <ListeningText heading>Luyện nghe hiểu</ListeningText>
      <ListeningText>{lesson.lines.length} câu hỏi từ bài nghe này.</ListeningText>
      <ListeningActionButton label="Bắt đầu trả lời" icon={listeningIcons.play}
        onPress={() => router.push({ pathname: '/practice/listening/exercise', params: { lessonId: lesson.id, mode: 'meaning' } })} />
      <ListeningActionButton secondary label="Luyện chính tả" icon={listeningIcons.pencil}
        onPress={() => router.push({ pathname: '/practice/listening/exercise', params: { lessonId: lesson.id, mode: 'choice' } })} />
    </ListeningPanel>
  );
}

const styles = StyleSheet.create({
  player: { gap: 9, marginBottom: 2 },
  cover: { aspectRatio: 1.85, overflow: 'hidden', borderRadius: 19, backgroundColor: '#B1BECF' },
  seekRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  seekTarget: { flex: 1, minHeight: 32, justifyContent: 'center' },
  knob: { position: 'absolute', top: -2.5, width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
  meta: { fontSize: 12, fontWeight: '600' },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', gap: 3 },
  speed: { minWidth: 41, minHeight: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  speedText: { fontSize: 13, fontWeight: '700' },
  overviewHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: 12, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: '600' },
  translate: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  translationTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  lines: { gap: 7 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 59 },
  lineCopy: { flex: 1, minWidth: 0, gap: 3 },
  japanese: { fontSize: 17, lineHeight: 23, fontWeight: '700' },
  reading: { fontSize: 12, lineHeight: 17 },
});
