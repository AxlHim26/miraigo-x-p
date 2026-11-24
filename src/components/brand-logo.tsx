import Svg, { Path } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';

export function BrandLogo({ compact = false, wordmarkColor = '#172033' }: { compact?: boolean; wordmarkColor?: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Svg width={compact ? 25 : 30} height={compact ? 25 : 30} viewBox="0 0 40 40" fill="none">
          <Path d="M10 24.5C10 17.0442 16.0442 11 23.5 11H31" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.92} />
          <Path d="M27 7L31 11L27 15" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.92} />
          <Path d="M10 30L18.2 22L22.8 26.6L31 18.5" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7.4 9.4L8.6 11.7L10.9 12.9L8.6 14.1L7.4 16.4L6.2 14.1L3.9 12.9L6.2 11.7L7.4 9.4Z" fill="white" fillOpacity={0.85} />
        </Svg>
      </View>
      <Text style={[styles.wordmark, compact && styles.wordmarkCompact, { color: wordmarkColor }]}>
        Mirai<Text style={styles.accent}>Go</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 44, height: 44, borderRadius: 16, backgroundColor: '#4F83FF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#79A8FF',
  },
  markCompact: { width: 38, height: 38, borderRadius: 14 },
  wordmark: { color: '#172033', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  wordmarkCompact: { fontSize: 19 },
  accent: { color: '#3D73F3' },
});
