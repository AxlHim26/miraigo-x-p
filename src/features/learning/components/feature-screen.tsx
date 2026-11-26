import { useRef, type ComponentRef } from 'react';
import { router, type Href } from 'expo-router';
import { Platform, StyleSheet, View, type ScrollView } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { LearnerCanvas, LearnerControl, LearnerGlyph, LearnerHeading, LearnerHero, LearnerPanel, LearnerSectionHeading, useLearnerPalette } from '@/components/ui/learner-glass';
import { useFeatureData } from '@/features/learning/hooks/use-feature-data';
import type { FeatureRoute, FeatureScreenConfig } from '@/features/learning/types/feature-screen';
import { jlptLevels } from '@/features/practice/components/jlpt-practice-screens';
import { WebToolsPanel } from '@/features/web-tools/components/web-tools-panel';

const featureViews = {
  '/courses': { title: 'Danh sách khóa học', list: 'Thư viện khóa học', glyph: '学', tone: 'blue', grid: true },
  '/grammar': { title: 'Ngữ pháp', list: 'Cấp độ ngữ pháp', glyph: '文', tone: 'indigo', grid: false },
  '/vocabulary': { title: 'Thư viện từ vựng', list: 'Nội dung từ vựng', glyph: '語', tone: 'emerald', grid: false },
  '/kanji': { title: 'Hán tự', list: 'Lộ trình Hán tự', glyph: '漢', tone: 'amber', grid: false },
  '/practice': { title: 'JLPT Dojo', list: 'Đề luyện JLPT', glyph: '練', tone: 'blue', grid: true },
} as const;

type FeatureScreenProps = { config: FeatureScreenConfig; route: FeatureRoute };

export function FeatureScreen({ config, route }: FeatureScreenProps) {
  const palette = useLearnerPalette();
  const reduceMotion = useReducedMotion();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionsOffset = useRef(0);
  const featureQuery = useFeatureData(route);
  const feature = featureViews[route];
  const remote = featureQuery.data?.source === 'backend';
  const sections = remote ? featureQuery.data?.sections ?? [] : config.sections;
  const showBanner = route === '/practice' || route === '/vocabulary';
  const darkBanner = route === '/practice';
  const roadmap = route === '/kanji';

  return (
    <LearnerCanvas scrollRef={scroll}>
      {showBanner ? (
        <LearnerHero glyph={feature.glyph} accent={darkBanner ? '#3B82F6' : '#60A5FA'} darkBanner={darkBanner}>
          <ThemedText type="smallBold" style={{ color: darkBanner ? '#BFDBFE' : palette.accentText }}>{config.eyebrow}</ThemedText>
          <ThemedText accessibilityRole="header" style={[styles.heroTitle, darkBanner && styles.bannerTitle]}>{feature.title}</ThemedText>
          <ThemedText themeColor="textSecondary" style={darkBanner && styles.bannerCopy}>{config.description}</ThemedText>
          <LearnerControl
            label={remote ? 'Xem nội dung' : 'Xem gợi ý'}
            glyph="↓"
            tone={darkBanner ? 'onDark' : 'accent'}
            onPress={() => scroll.current?.scrollTo({ y: sectionsOffset.current, animated: !reduceMotion })}
            style={styles.action}
          />
        </LearnerHero>
      ) : (
        <LearnerHeading title={feature.title} description={config.description} />
      )}

      {remote && featureQuery.data?.summary && (
        <LearnerPanel>
          <ThemedText type="smallBold" style={{ color: palette.accentText }}>{featureQuery.data.summary}</ThemedText>
        </LearnerPanel>
      )}

      {route === '/vocabulary' && (
        <LearnerControl label="Ôn từ đến hạn" tone="accent" onPress={() => router.navigate('/vocabulary/review')} style={styles.action} />
      )}
      {route === '/practice' && (
        <LearnerPanel>
          <LearnerSectionHeading title="Ôn theo cấp độ" />
          <View style={styles.levels}>
            {jlptLevels.map((level) => (
              <LearnerControl key={level} label={level} onPress={() => router.push({
                pathname: '/practice/jlpt/[level]', params: { level: level.toLowerCase() },
              })} />
            ))}
          </View>
          <LearnerControl label="Kiểm tra xếp lớp" tone="accent" onPress={() => router.push({
            pathname: '/practice/jlpt/[level]/quiz', params: { level: 'placement' },
          })} style={styles.action} />
          <LearnerControl label="Lịch sử làm bài" onPress={() => router.navigate('/practice/jlpt/history')} style={styles.action} />
        </LearnerPanel>
      )}

      {route === '/practice' && (
        <LearnerPanel>
          <LearnerSectionHeading title="Luyện nghe và từ vựng" />
          <LearnerControl label="Luyện nghe và chép chính tả" glyph="›" onPress={() => router.push('/practice/listening')} />
          <LearnerControl label="Flashcard từ vựng" glyph="›" onPress={() => router.push('/practice/flashcard')} />
          {Platform.OS !== 'web' && (
            <>
              <LearnerControl label="Luyện phát âm" glyph="›" onPress={() => router.push({ pathname: '/practice/voice/[mode]', params: { mode: 'pronunciation' } })} />
              <LearnerControl label="Shadowing" glyph="›" onPress={() => router.push({ pathname: '/practice/voice/[mode]', params: { mode: 'shadowing' } })} />
              <LearnerControl label="Shadowing YouTube" glyph="›" onPress={() => router.push('/practice/youtube' as Href)} />
              <LearnerControl label="Phiên âm tệp ghi âm" glyph="›" onPress={() => router.push({ pathname: '/practice/voice/[mode]', params: { mode: 'transcribe' } })} />
            </>
          )}
        </LearnerPanel>
      )}
      {route === '/vocabulary' && <LearnerControl label="Bộ từ của tôi và cộng đồng" glyph="›" onPress={() => router.push('/vocabulary/sets')} />}
      {route === '/kanji' && <View style={styles.levels}>
        <LearnerControl label="Kanji Map" onPress={() => router.push('/kanji/map')} />
        <LearnerControl label="Tra chữ viết tay" onPress={() => router.push('/kanji/handwriting')} />
      </View>}
      {route === '/practice' && (
        <>
          <LearnerPanel>
            <LearnerSectionHeading title="Hội thoại và đọc hiểu" />
            <LearnerControl label="AI Chat" glyph="›" onPress={() => router.push('/practice/chat')} />
            <LearnerControl label="Hội thoại" glyph="›" onPress={() => router.push('/practice/conversation')} />
            <LearnerControl label="Luyện đọc" glyph="›" onPress={() => router.push('/practice/reading')} />
          </LearnerPanel>
          <WebToolsPanel groups={['practice', 'jlpt']} />
        </>
      )}

      {featureQuery.isPending && (
        <LearnerPanel>
          <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">Đang tải dữ liệu học tập…</ThemedText>
        </LearnerPanel>
      )}
      {featureQuery.isError && (
        <LearnerPanel>
          <ThemedText type="smallBold">Chưa cập nhật được nội dung</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {remote ? 'Đang hiển thị dữ liệu đã tải trước đó.' : 'Bạn vẫn có thể xem nội dung gợi ý bên dưới.'}
          </ThemedText>
          <LearnerControl
            label={featureQuery.isFetching ? 'Đang tải lại…' : 'Thử lại'}
            disabled={featureQuery.isFetching}
            onPress={() => void featureQuery.refetch()}
            style={styles.action}
          />
        </LearnerPanel>
      )}

      <View style={styles.list} onLayout={(event) => { sectionsOffset.current = event.nativeEvent.layout.y; }}>
        <LearnerSectionHeading title={remote || roadmap ? feature.list : 'Nội dung gợi ý'} detail={
          <ThemedText type="small" themeColor="textSecondary">{sections.length} mục</ThemedText>
        } />
        {sections.length === 0 && (
          <LearnerPanel><ThemedText type="small" themeColor="textSecondary">Chưa có nội dung được công bố.</ThemedText></LearnerPanel>
        )}
        <View style={[styles.list, feature.grid && styles.grid]}>
          {sections.map(({ id, title, description, meta, href }, index) => (
            <LearnerPanel key={id ?? `${title}-${index}`} style={feature.grid ? styles.tile : styles.row}>
              <LearnerGlyph glyph={roadmap ? String(index + 1).padStart(2, '0') : feature.glyph} tone={feature.tone} />
              <View style={feature.grid ? styles.tileCopy : styles.copy}>
                <ThemedText type="smallBold" style={styles.itemTitle}>{title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
                {remote && <ThemedText type="smallBold" style={{ color: palette.accentText }}>{meta}</ThemedText>}
                {href && (
                  <LearnerControl label="Mở nội dung" accessibilityLabel={`Mở ${title}`} glyph="›" onPress={() => router.push(href)} style={styles.action} />
                )}
              </View>
            </LearnerPanel>
          ))}
        </View>
      </View>
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  heroTitle: { fontSize: 32, lineHeight: 37, fontWeight: '800', maxWidth: 350 },
  bannerTitle: { color: '#F8FAFC' },
  bannerCopy: { color: '#CBD5E1' },
  action: { alignSelf: 'flex-start', maxWidth: '100%' },
  list: { gap: 10 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { flexBasis: 145, flexGrow: 1, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tileCopy: { gap: 4 },
  copy: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 16, lineHeight: 21 },
});
