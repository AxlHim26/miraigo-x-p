import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack, LearnerLoadState } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel, useLearnerPalette } from '@/components/ui/learner-glass';
import { findKanji } from '@/features/kanji/data/catalog';
import { getKanjiMap, recognizeKanji, type KanjiMap, type Point } from '@/features/kanji/services/kanji-tools-service';
import { useTheme } from '@/hooks/use-theme';

const singleKanji = (input: string) => /^\p{Script=Han}$/u.test(input.trim());
const canvasSize = 300;

export function KanjiMapScreen() {
  const { glyph } = useLocalSearchParams<{ glyph?: string }>();
  const initial = glyph && singleKanji(glyph) ? glyph : '学';
  return (
    <LearnerCanvas>
      <LearnerBack label="Hán tự" href="/kanji" />
      <LearnerHeading title="Kanji Map" />
      <MapContent key={initial} initial={initial} />
    </LearnerCanvas>
  );
}

function MapContent({ initial }: { initial: string }) {
  const router = useRouter();
  const palette = useLearnerPalette();
  const theme = useTheme();
  const [glyph, setGlyph] = useState(initial);
  const [input, setInput] = useState(initial);
  const [animate, setAnimate] = useState(false);
  const query = useQuery({
    queryKey: ['kanji-map', glyph],
    queryFn: ({ signal }) => getKanjiMap(glyph, signal),
    staleTime: 86_400_000,
  });
  const catalogInfo = findKanji(glyph);
  function select(value: string) {
    setGlyph(value);
    setInput(value);
    setAnimate(false);
  }

  return (
    <>
      <TextInput accessibilityLabel="Nhập một chữ Hán" placeholder="Nhập một chữ Hán, ví dụ 学"
        placeholderTextColor={theme.textSecondary} value={input} autoCorrect={false}
        onChangeText={setInput} onSubmitEditing={() => { if (singleKanji(input)) select(input.trim()); }}
        style={[styles.input, { borderColor: palette.border, color: palette.text }]} />
      <View style={styles.row}>
        <LearnerControl label="Xem bản đồ" tone="accent" disabled={!singleKanji(input)} onPress={() => select(input.trim())} />
        <LearnerControl label="Viết tay" onPress={() => router.push('/kanji/handwriting')} />
      </View>
      {catalogInfo && <ThemedText>{glyph} · {catalogInfo.level} · {catalogInfo.row[1]}</ThemedText>}
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.data && (
        <LearnerPanel>
          <KanjiGraph map={query.data} onSelect={select} />
          {query.data.radical && <ThemedText>Bộ thủ {query.data.radical}</ThemedText>}
          {query.data.parts.length > 0 && <ThemedText>Thành phần {query.data.parts.join(' · ')}</ThemedText>}
          {query.data.strokeOrderGif && <LearnerControl label={animate ? 'Ẩn thứ tự nét' : 'Xem thứ tự nét'} onPress={() => setAnimate(!animate)} />}
          {animate && query.data.strokeOrderGif && <StrokeOrder key={glyph} uri={query.data.strokeOrderGif} glyph={glyph} />}
          <View style={styles.row}>
            {query.data.related.map((item) => (
              <LearnerControl key={item.glyph} label={item.glyph}
                accessibilityHint={item.sameRadical ? 'Cùng bộ thủ' : `Chung thành phần ${item.sharedParts.join(' ')}`}
                onPress={() => select(item.glyph)} />
            ))}
          </View>
        </LearnerPanel>
      )}
    </>
  );
}

function StrokeOrder({ uri, glyph }: { uri: string; glyph: string }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <ThemedText>Không tải được hình thứ tự nét.</ThemedText>
    : <Image source={uri} accessibilityLabel={`Thứ tự nét của ${glyph}`} autoplay onError={() => setFailed(true)}
        style={styles.animation} contentFit="contain" />;
}

function KanjiGraph({ map, onSelect }: { map: KanjiMap; onSelect: (glyph: string) => void }) {
  const palette = useLearnerPalette();
  const nodes = map.related.slice(0, 8);
  return (
    <View style={styles.drawing}>
      <Svg width="100%" height="100%" viewBox="0 0 300 300" accessibilityLabel={`Bản đồ chữ ${map.glyph}`}>
        {nodes.map((item, index) => {
          const angle = index * (2 * Math.PI / nodes.length) - Math.PI / 2;
          const x = 150 + Math.cos(angle) * 107;
          const y = 150 + Math.sin(angle) * 107;
          return (
            <G key={item.glyph} onPress={() => onSelect(item.glyph)}>
              <Line x1={150} y1={150} x2={x} y2={y} stroke={palette.border} strokeWidth={2} />
              <Circle cx={x} cy={y} r={23} fill={palette.hero} stroke={palette.border} />
              <SvgText x={x} y={y + 8} textAnchor="middle" fontSize={24} fill={palette.text}>{item.glyph}</SvgText>
            </G>
          );
        })}
        <Circle cx={150} cy={150} r={36} fill={palette.selection} stroke={palette.accentTitle} />
        <SvgText x={150} y={163} textAnchor="middle" fontSize={40} fill={palette.text}>{map.glyph}</SvgText>
      </Svg>
    </View>
  );
}

export function KanjiHandwritingScreen() {
  const router = useRouter();
  const palette = useLearnerPalette();
  const width = useRef(canvasSize);
  const active = useRef<Point[]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const search = useMutation({ mutationFn: recognizeKanji });

  function pointFor({ nativeEvent: { locationX, locationY } }: GestureResponderEvent): Point {
    const normalize = (value: number) => Math.round(Math.max(0, Math.min(canvasSize, value * canvasSize / width.current)));
    return { x: normalize(locationX), y: normalize(locationY) };
  }

  function finish() {
    const stroke = active.current;
    if (stroke.length > 0) setStrokes((last) => [...last, stroke]);
    resetStroke();
  }

  function resetStroke() {
    active.current = [];
    setCurrent([]);
  }

  return (
    <LearnerCanvas>
      <LearnerBack label="Hán tự" href="/kanji" />
      <LearnerHeading title="Tra chữ viết tay" description="Viết một chữ Hán rồi chọn Nhận diện." />
      <LearnerPanel>
        <View
          style={[styles.drawing, { borderColor: palette.border, borderWidth: 1 }]}
          onLayout={(event) => { width.current = Math.max(1, event.nativeEvent.layout.width); }}
          onStartShouldSetResponder={() => !search.isPending && strokes.length < 40}
          onResponderTerminationRequest={() => false}
          onResponderTerminate={resetStroke}
          onResponderGrant={(event) => {
            search.reset();
            active.current = [pointFor(event)];
            setCurrent(active.current);
          }}
          onResponderMove={(event) => {
            if (!active.current.length || active.current.length >= 128) return;
            const next = pointFor(event);
            const previous = active.current[active.current.length - 1];
            if (Math.hypot(next.x - previous.x, next.y - previous.y) < 3) return;
            active.current = [...active.current, next];
            setCurrent(active.current);
          }}
          onResponderRelease={finish}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%" viewBox="0 0 300 300">
              <Line x1={150} y1={0} x2={150} y2={300} stroke={palette.border} strokeDasharray="5 5" />
              <Line x1={0} y1={150} x2={300} y2={150} stroke={palette.border} strokeDasharray="5 5" />
              {[...strokes, current].filter((line) => line.length > 0).map((line, index) => (
                line.length === 1
                  ? <Circle key={index} cx={line[0].x} cy={line[0].y} r={3} fill={palette.text} />
                  : <Polyline key={index} points={line.map(({ x, y }) => `${x},${y}`).join(' ')}
                      stroke={palette.text} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ))}
            </Svg>
          </View>
        </View>
        <View style={styles.row}>
          <LearnerControl label="Hoàn tác" disabled={!strokes.length || search.isPending}
            onPress={() => { search.reset(); setStrokes(strokes.slice(0, -1)); }} />
          <LearnerControl label="Xóa nét" disabled={!strokes.length || search.isPending}
            onPress={() => { search.reset(); setStrokes([]); }} />
          <LearnerControl label={search.isPending ? 'Đang nhận diện…' : 'Nhận diện'} tone="accent"
            disabled={!strokes.length || search.isPending || !!current.length} onPress={() => search.mutate(strokes)} />
        </View>
      </LearnerPanel>
      {search.isError && <ThemedText accessibilityLiveRegion="polite">Dịch vụ nhận diện chưa phản hồi. Hãy thử lại.</ThemedText>}
      {search.data?.length === 0 && <ThemedText>Chưa nhận diện được chữ. Thử viết lại rõ hơn.</ThemedText>}
      <View style={styles.row}>
        {search.data?.map((glyph) => (
          <LearnerControl key={glyph} label={glyph} onPress={() => router.push({ pathname: '/kanji/map', params: { glyph } })} />
        ))}
      </View>
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 46, padding: 10, fontSize: 17 },
  drawing: { width: '100%', maxWidth: 360, aspectRatio: 1, alignSelf: 'center' },
  animation: { width: 150, height: 150, backgroundColor: '#fff', alignSelf: 'center' },
});
