import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudyIcon, studySymbol } from '@/components/ui/study-icon';
import { StudyScreen, useStudyColors } from '@/components/ui/study-screen';
import { studyColors } from '@/constants/study-colors';
import { env } from '@/core/config/env';
import { ProfileAction, ProfileGlyph } from '@/features/auth/profile/profile-menu-ui';

const crown = studySymbol('crown.fill', 'workspace_premium');
const check = studySymbol('checkmark', 'check');
const benefits = [
  'Truy cập toàn bộ khóa học N5 – N2',
  'Tạo bài học bằng AI không giới hạn',
  'Luyện tập JLPT đầy đủ, gồm từ vựng, ngữ pháp và đọc hiểu',
  'Không quảng cáo',
  'Đồng bộ dữ liệu đa thiết bị',
];
const plans = [
  { period: '1 tháng', price: '49.000₫' },
  { period: '3 tháng', price: '129.000₫', discount: '-12%', badge: '#C64053' },
  { period: '12 tháng', price: '399.000₫', discount: '-32%', badge: '#A96306' },
] as const;
type Plan = typeof plans[number];

export function ProfileUpgrade() {
  const [selected, select] = useState<Plan>(plans[2]);
  const [confirmed, confirm] = useState(false);
  return (
    <StudyScreen title="Gói nâng cấp" back="/account" largeTitle
      footer={env.demoMode && <ProfileAction label="Nâng cấp ngay" onPress={() => confirm(true)} />}>
      <PremiumOffer selected={selected} confirmed={confirmed} onSelect={(plan) => { select(plan); confirm(false); }} />
    </StudyScreen>
  );
}

function PremiumOffer({ selected, confirmed, onSelect }: { selected: Plan; confirmed: boolean; onSelect: (plan: Plan) => void }) {
  const colors = useStudyColors();
  const dark = colors === studyColors.dark;
  return (
    <>
      <View style={[styles.banner, {
        backgroundColor: dark ? '#303754' : '#E5EBFC',
        backgroundImage: dark
          ? 'linear-gradient(115deg, #534632, #293B61 33%, #303754)'
          : 'linear-gradient(115deg, #FCE9BB, #D7E6FC 30%, #E9E9FB 78%)',
      }]}>
        <ProfileGlyph icon={crown} tone="gold" size={48} />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.bannerTitle, { color: colors.title }]}>Premium</Text>
          <Text style={[styles.description, { color: colors.secondary }]}>
            {env.demoMode ? 'Học hiệu quả hơn với đầy đủ tính năng' : 'Gói nâng cấp đang được chuẩn bị'}
          </Text>
        </View>
      </View>
      {env.demoMode && (
        <>
          <View style={styles.benefits}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefit}>
                <View style={styles.check}><StudyIcon name={check} color="#FFFFFF" size={11} /></View>
                <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>
          <View accessibilityRole="radiogroup" style={styles.plans}>
            {plans.map((plan) => {
              const checked = selected.period === plan.period;
              return (
                <Pressable key={plan.period} accessibilityRole="radio" accessibilityState={{ checked }}
                  accessibilityLabel={plan.period + ', ' + plan.price + ('discount' in plan ? ', giảm ' + plan.discount.slice(1) : '')}
                  onPress={() => onSelect(plan)} style={({ pressed }) => [styles.plan, {
                    backgroundColor: checked ? colors.iconFill : colors.surface,
                    borderColor: checked ? (dark ? '#5987AC' : '#D1E7FD') : colors.border,
                    boxShadow: `0px 3px 8px ${colors.shadow}`, opacity: pressed ? 0.7 : 1,
                  }]}>
                  <View style={[styles.radio, { borderColor: checked ? studyColors.light.icon : (dark ? '#69849B' : '#BAC9DD') }, checked && styles.radioChecked]}>
                    {checked && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.period, { color: colors.title }]}>{plan.period}</Text>
                  {'discount' in plan && <Text style={[styles.discount, { backgroundColor: plan.badge }]}>{plan.discount}</Text>}
                  <Text style={[styles.price, { color: colors.text }]}>{plan.price}</Text>
                </Pressable>
              );
            })}
          </View>
          {confirmed && <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.green }]}>Đã mô phỏng nâng cấp gói {selected.period}.</Text>}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, minHeight: 74, padding: 11 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  bannerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.65 },
  description: { fontSize: 13, lineHeight: 17 },
  benefits: { gap: 9, paddingHorizontal: 12, paddingVertical: 2 },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  check: { width: 17, height: 17, marginTop: 1, borderRadius: 9, backgroundColor: studyColors.light.icon, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  plans: { gap: 5 },
  plan: { minHeight: 49, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioChecked: { backgroundColor: studyColors.light.icon },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  period: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: '700' },
  discount: { color: '#FFFFFF', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2, fontSize: 10, fontWeight: '800' },
  price: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  feedback: { paddingHorizontal: 7, fontWeight: '600', fontSize: 13 },
});
