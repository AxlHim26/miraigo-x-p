import { useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useLearnerPalette } from '@/components/ui/learner-glass';
import { getLearnerTabIndex, learnerTabs } from '@/constants/learner-navigation';
import { studyColors } from '@/constants/study-colors';

export function LearnerBottomNavigation() {
  const [width, setWidth] = useState(0);
  const { dark } = useLearnerPalette();
  const colors = studyColors[dark ? 'dark' : 'light'];
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = getLearnerTabIndex(pathname);
  const slotWidth = Math.max(0, (width - 8) / learnerTabs.length);
  const indicatorX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const energy = useSharedValue(0);
  const dragging = useSharedValue(false);
  const indicatorStyle = useAnimatedStyle(() => ({
    width: Math.max(0, slotWidth - 8),
    transform: [{ translateX: indicatorX.get() }, { scaleX: scaleX.get() }, { scaleY: scaleY.get() }],
  }));

  useAnimatedReaction(
    () => ({ activeIndex, slotWidth, dragging: dragging.get() }),
    (current, previous) => {
      if (!current.slotWidth || current.dragging) return;
      const target = current.activeIndex * current.slotWidth + 8;
      if (!previous?.slotWidth) indicatorX.set(target);
      else if (previous.activeIndex !== current.activeIndex || previous.slotWidth !== current.slotWidth) {
        indicatorX.set(withSpring(target, { damping: 14, stiffness: 160 }));
      }
    },
    [activeIndex, slotWidth],
  );

  useFrameCallback((frame) => {
    if (!dragging.get() || !frame.timeSincePreviousFrame) return;
    energy.set(energy.get() * Math.exp(-frame.timeSincePreviousFrame / 145));
    scaleX.set(1 + energy.get() * 0.3);
    scaleY.set(1 - energy.get() * 0.15);
  });

  const navigate = (index: number) => router.navigate(learnerTabs[index].route);
  const pan = usePanGesture({
    minDistance: 7,
    onActivate: () => dragging.set(true),
    onUpdate: (event) => {
      if (!slotWidth) return;
      indicatorX.set(Math.max(8, Math.min(width - slotWidth, event.x - (slotWidth - 8) / 2)));
      energy.set(Math.min(1, Math.abs(event.velocityX) / 1800));
    },
    onDeactivate: (event) => {
      if (!slotWidth) return;
      const index = Math.max(0, Math.min(learnerTabs.length - 1, Math.floor((event.x - 4) / slotWidth)));
      indicatorX.set(withSpring(index * slotWidth + 8, { damping: 14, stiffness: 160 }));
      scaleX.set(withSpring(1));
      scaleY.set(withSpring(1));
      dragging.set(false);
      runOnJS(navigate)(index);
    },
  });

  const pressTab = (index: number) => {
    indicatorX.set(withSpring(index * slotWidth + 8, { damping: 14, stiffness: 160 }));
    scaleX.set(withSequence(withTiming(1.18, { duration: 80 }), withSpring(1)));
    scaleY.set(withSequence(withTiming(0.92, { duration: 80 }), withSpring(1)));
    navigate(index);
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <GestureDetector gesture={pan}>
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.bar, {
          backgroundColor: colors.surface, borderColor: colors.border, boxShadow: `0px 3px 12px ${colors.shadow}`,
        }]}>
          {width > 0 && <Animated.View pointerEvents="none" style={[styles.indicator, { backgroundColor: colors.iconFill }, indicatorStyle]} />}
          {learnerTabs.map((tab, index) => {
            const active = activeIndex === index;
            const color = active ? colors.icon : colors.secondary;
            return (
              <Pressable key={tab.name} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} onPress={() => pressTab(index)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <SymbolView name={tab.icon} fallback={<Text style={{ color, fontSize: 22 }}>{tab.fallback}</Text>} tintColor={color} size={22} />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color }, active && styles.selectedLabel]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { paddingHorizontal: 11, paddingTop: 4, paddingBottom: 3 },
  bar: { width: '100%', maxWidth: 540, alignSelf: 'center', minHeight: 57, borderRadius: 29, borderWidth: 1, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 30 },
  item: { flex: 1, minWidth: 0, height: 51, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: -0.2 },
  selectedLabel: { fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
