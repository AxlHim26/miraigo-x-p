import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol, type StudySymbol } from '@/components/ui/study-icon';
import { StudyActionButton, StudyPanel, StudyProgressBar, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { readingStatus } from '@/features/reading/data/reading-progress';
import type { ReadingArticle, ReadingWord } from '@/features/reading/data/reading-schema';
import type { useReadingProgress } from '@/features/reading/hooks/use-reading-progress';

export function ArticleUnavailable({ study }: { study: ReturnType<typeof useReadingProgress> }) {
  return (
    <StudyScreen title="Luyện đọc" back="/practice/reading">
      <StudyPanel>
        <StudyText>{study.readError ? 'Chưa tải được dữ liệu luyện đọc.' : !study.ready ? 'Đang mở bài đọc…' : 'Không tìm thấy bài đọc.'}</StudyText>
        {study.readError && <StudyActionButton secondary label="Thử lại" onPress={() => void study.retry()} />}
      </StudyPanel>
    </StudyScreen>
  );
}

export const readingIcons = {
  book: studySymbol('book', 'menu_book'),
  sparkles: studySymbol('sparkles', 'auto_awesome'),
  repeat: studySymbol('arrow.clockwise', 'refresh'),
  saved: studySymbol('bookmark', 'bookmark_border'),
  savedFill: studySymbol('bookmark.fill', 'bookmark'),
  search: studySymbol('magnifyingglass', 'search'),
  clock: studySymbol('clock', 'schedule'),
  count: studySymbol('list.bullet', 'format_list_bulleted'),
  document: studySymbol('doc.text', 'description'),
  next: studySymbol('chevron.right', 'chevron_right'),
  down: studySymbol('chevron.down', 'expand_more'),
  up: studySymbol('chevron.up', 'expand_less'),
  play: studySymbol('play.fill', 'play_arrow'),
  pause: studySymbol('pause.fill', 'pause'),
  chart: studySymbol('chart.bar.xaxis', 'bar_chart'),
  check: studySymbol('checkmark.circle', 'check_circle_outline'),
  error: studySymbol('xmark.circle.fill', 'cancel'),
  circle: studySymbol('circle', 'radio_button_unchecked'),
  audio: studySymbol('speaker.wave.2', 'volume_up'),
  star: studySymbol('star', 'star_outline'),
  starFill: studySymbol('star.fill', 'star'),
  info: studySymbol('info.circle', 'info'),
  target: studySymbol('scope', 'track_changes'),
};

export function ReadingRow({ title, subtitle, icon, onPress, trailing, progress }: {
  title: string;
  subtitle?: string;
  icon: StudySymbol;
  onPress: () => void;
  trailing?: StudySymbol;
  progress?: number;
}) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="link" onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 9px ${colors.shadow}`, opacity: pressed ? 0.68 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: colors.iconFill }]}>
        <StudyIcon name={icon} color={colors.icon} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.small, { color: colors.secondary }]}>{subtitle}</Text>}
        {!!progress && (
          <View style={styles.progressRow}>
            <StudyProgressBar fraction={progress} style={styles.progress} />
            <Text style={[styles.percent, { color: colors.blue }]}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </View>
      <StudyIcon name={trailing ?? readingIcons.next} color={colors.icon} size={18} />
    </Pressable>
  );
}

export function ArticleRow({ article, status, answered, onPress }: { article: ReadingArticle; status: ReturnType<typeof readingStatus>; answered: number; onPress: () => void }) {
  return (
    <ReadingRow title={article.title} subtitle={`${article.level} · ~${article.minutes} phút · ${article.questions.length} câu${article.source === 'ai' ? ' · AI' : ''}`}
      icon={readingIcons.document} trailing={status === 'Đã xong' ? readingIcons.check : status === 'Đang học' ? readingIcons.play : readingIcons.circle}
      progress={status === 'Đang học' ? Math.min(1, answered / article.questions.length) : undefined} onPress={onPress} />
  );
}

export function ReadingBadge({ text, icon }: { text: string; icon?: StudySymbol }) {
  const colors = useStudyColors();
  return (
    <View style={[styles.badge, { backgroundColor: icon ? colors.surface : colors.iconFill }]}>
      {icon && <StudyIcon name={icon} color={colors.icon} size={13} />}
      <Text style={[styles.badgeText, { color: icon ? colors.secondary : colors.blue }]}>{text}</Text>
    </View>
  );
}

export function JapaneseReadingText({ text, words, small = false }: { text: string; words: readonly ReadingWord[]; small?: boolean }) {
  const colors = useStudyColors();
  const tracked = words.filter(({ term, reading }) => term !== reading && /\p{Script=Han}/u.test(term) && text.includes(term))
    .sort((a, b) => b.term.length - a.term.length);
  if (!tracked.length) {
    return <Text selectable style={[styles.japanese, small && styles.japaneseSmall, { color: colors.title }]}>{text}</Text>;
  }

  const pieces: { text: string; reading?: string }[] = [];
  for (let index = 0; index < text.length;) {
    const match = tracked.find(({ term }) => text.startsWith(term, index));
    if (match) {
      pieces.push({ text: match.term, reading: match.reading });
      index += match.term.length;
    } else {
      const glyph = String.fromCodePoint(text.codePointAt(index)!);
      pieces.push({ text: glyph });
      index += glyph.length;
    }
  }

  return (
    <View accessible accessibilityLabel={text} style={styles.rubyLine}>
      {pieces.map((piece, index) => (
        <View key={index} style={styles.rubyPiece}>
          {piece.reading && <Text allowFontScaling style={[styles.ruby, { color: colors.secondary }]}>{piece.reading}</Text>}
          <Text style={[styles.japanese, small && styles.japaneseSmall, { color: colors.title }]}>{piece.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 62, borderWidth: StyleSheet.hairlineWidth, borderRadius: 17, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  icon: { width: 38, height: 38, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 15, fontWeight: '700' },
  small: { fontSize: 12, lineHeight: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  progress: { flex: 1, height: 5 },
  percent: { fontSize: 10, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  rubyLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', rowGap: 3 },
  rubyPiece: { alignItems: 'center' },
  ruby: { fontSize: 9, lineHeight: 11, fontWeight: '600', textAlign: 'center' },
  japanese: { fontSize: 18, lineHeight: 28, fontWeight: '600' },
  japaneseSmall: { fontSize: 15, lineHeight: 23 },
});
