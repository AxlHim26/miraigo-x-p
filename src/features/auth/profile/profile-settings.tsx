import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { StudyIcon, studySymbol } from '@/components/ui/study-icon';
import { StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { studyColors } from '@/constants/study-colors';
import { env } from '@/core/config/env';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { ProfileAction, ProfileMenuRow, ProfileSheet } from '@/features/auth/profile/profile-menu-ui';
import { levels, themes, useLearnerProfile, type LearnerProfile } from '@/features/auth/profile/use-learner-profile';

const icons = {
  person: studySymbol('person', 'person'),
  lock: studySymbol('lock', 'lock'),
  study: studySymbol('gearshape', 'settings'),
  theme: studySymbol('circle.lefthalf.filled', 'contrast'),
  globe: studySymbol('globe', 'language'),
  bell: studySymbol('bell', 'notifications_none'),
  devices: studySymbol('laptopcomputer', 'devices'),
  goal: studySymbol('scope', 'track_changes'),
  calendar: studySymbol('calendar', 'calendar_month'),
  time: studySymbol('clock', 'schedule'),
  streak: studySymbol('flame', 'local_fire_department'),
  check: studySymbol('checkmark.circle.fill', 'check_circle'),
  shield: studySymbol('checkmark.shield', 'verified_user'),
  phone: studySymbol('phone', 'call'),
  email: studySymbol('envelope', 'mail'),
  trash: studySymbol('trash', 'delete_outline'),
};
const days = [
  { value: 1, label: 'T2' }, { value: 2, label: 'T3' }, { value: 3, label: 'T4' },
  { value: 4, label: 'T5' }, { value: 5, label: 'T6' }, { value: 6, label: 'T7' }, { value: 7, label: 'CN' },
];
type SettingsPanel = 'theme' | 'language' | 'notifications' | 'devices';
type LearningPanel = 'currentLevel' | 'goal' | 'minutes' | 'streakGoal' | 'reminderTime' | 'reminderDays';

export function ProfileSettings() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const [panel, setPanel] = useState<SettingsPanel>();
  const [error, setError] = useState('');
  const close = () => { setPanel(undefined); setError(''); };
  const openNotificationSettings = () => {
    if (Platform.OS !== 'web') void Linking.openSettings().catch(() => setError('Chưa mở được cài đặt thiết bị.'));
  };
  return (
    <StudyScreen title="Tài khoản & Cài đặt" back="/account">
      <View style={styles.list}>
        <ProfileMenuRow title="Thông tin cá nhân" subtitle="Xem và chỉnh sửa hồ sơ" icon={icons.person} onPress={() => router.push('/account/profile')} />
        <ProfileMenuRow title="Bảo mật tài khoản" subtitle="Email và phiên đăng nhập" icon={icons.lock} onPress={() => router.push('/account/security')} />
        <ProfileMenuRow title="Cài đặt học tập" subtitle="Mục tiêu, nhắc học, cấp độ" icon={icons.study} onPress={() => router.push('/account/learning')} />
        <ProfileMenuRow title="Giao diện" subtitle="Sáng / Tối / Theo hệ thống" icon={icons.theme} onPress={() => setPanel('theme')} />
        <ProfileMenuRow title="Ngôn ngữ ứng dụng" subtitle="Tiếng Việt" icon={icons.globe} onPress={() => setPanel('language')} />
        <ProfileMenuRow title="Thông báo" subtitle="Bài học, nhắc học, cập nhật" icon={icons.bell} onPress={() => setPanel('notifications')} />
        <ProfileMenuRow title="Quản lý thiết bị" subtitle="Thiết bị đang đăng nhập" icon={icons.devices} onPress={() => setPanel('devices')} />
      </View>
      {panel === 'theme' && (
        <ProfileSheet title="Giao diện" close={close}>
          {themes.map((theme) => (
            <SettingChoice key={theme} label={theme} selected={profile.data.theme === theme} onPress={() => {
              if (!profile.query.isSuccess || profile.saving) return;
              void profile.save({ theme }).then(close, () => setError('Chưa lưu được giao diện.'));
            }} />
          ))}
          {!!error && <StudyText>{error}</StudyText>}
        </ProfileSheet>
      )}
      {panel === 'language' && (
        <ProfileSheet title="Ngôn ngữ ứng dụng" close={close}>
          <SettingChoice label="Tiếng Việt" selected onPress={close} />
        </ProfileSheet>
      )}
      {panel === 'notifications' && (
        <ProfileSheet title="Thông báo" close={close}>
          <ProfileMenuRow title="Nhắc học hằng ngày" subtitle="Giờ và ngày nhắc học" icon={icons.bell}
            onPress={() => { close(); router.push('/account/learning'); }} />
          {Platform.OS !== 'web' && <ProfileMenuRow title="Thông báo trên thiết bị" subtitle="Mở cài đặt hệ thống" icon={icons.devices} onPress={openNotificationSettings} />}
          {!!error && <StudyText>{error}</StudyText>}
        </ProfileSheet>
      )}
      {panel === 'devices' && <CurrentSession close={close} />}
    </StudyScreen>
  );
}

export function ProfileLearningSettings() {
  const profile = useLearnerProfile();
  const [panel, setPanel] = useState<LearningPanel>();
  const [draft, setDraft] = useState('');
  const [selectedDays, setDays] = useState<number[]>([]);
  const [error, setError] = useState('');
  const editable = profile.query.isSuccess && !profile.saving;
  const close = () => setPanel(undefined);
  const save = (patch: Partial<LearnerProfile>) => {
    if (!editable) return;
    setError('');
    void profile.save(patch).then(close, () => setError('Chưa lưu được cài đặt.'));
  };
  const open = (name: LearningPanel) => {
    setError('');
    setDraft(String(profile.data[name]));
    setDays(profile.data.reminderDays);
    setPanel(name);
  };
  const { currentLevel, goal, minutes, streakGoal, reminderEnabled, reminderTime, reminderDays } = profile.data;
  const daysLabel = reminderDays.length === days.length ? 'Tất cả' : days.filter(({ value }) => reminderDays.includes(value)).map(({ label }) => label).join(', ');
  const numeric = panel === 'minutes' || panel === 'streakGoal';
  const valid = panel === 'minutes' ? /^\d+$/.test(draft) && +draft >= 5 && +draft <= 180
    : panel === 'streakGoal' ? /^\d+$/.test(draft) && +draft >= 1 && +draft <= 365
    : /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft);
  return (
    <StudyScreen title="Cài đặt học tập" back="/settings" largeTitle>
      <View style={styles.list}>
        <ProfileMenuRow title="Cấp độ hiện tại" icon={icons.person} value={currentLevel} onPress={() => open('currentLevel')} />
        <ProfileMenuRow title="Cấp độ mục tiêu" icon={icons.goal} value={goal} onPress={() => open('goal')} />
        <ProfileMenuRow title="Mục tiêu học mỗi ngày" icon={icons.time} value={`${minutes} phút`} onPress={() => open('minutes')} />
        <ProfileMenuRow title="Mục tiêu học liên tiếp" icon={icons.streak} value={`${streakGoal} ngày`} onPress={() => open('streakGoal')} />
      </View>
      {env.demoMode ? (
        <View style={styles.list}>
          <ProfileMenuRow title="Nhắc học hằng ngày" subtitle="Nhắc bạn học đúng giờ" icon={icons.bell}
            end={<SettingSwitch label="Nhắc học hằng ngày" value={reminderEnabled} disabled={!editable} onChange={(value) => save({ reminderEnabled: value })} />} />
          <ProfileMenuRow title="Giờ nhắc học" icon={icons.time} value={reminderTime} onPress={() => open('reminderTime')} />
          <ProfileMenuRow title="Ngày trong tuần" icon={icons.calendar} value={daysLabel} onPress={() => open('reminderDays')} />
        </View>
      ) : Platform.OS !== 'web' && <ProfileMenuRow title="Thông báo học tập" subtitle="Quyền thông báo trên thiết bị" icon={icons.bell}
        onPress={() => void Linking.openSettings().catch(() => setError('Chưa mở được cài đặt thiết bị.'))} />}
      {!panel && !!error && <StudyText>{error}</StudyText>}
      {(panel === 'currentLevel' || panel === 'goal') && (
        <ProfileSheet title={panel === 'currentLevel' ? 'Cấp độ hiện tại' : 'Cấp độ mục tiêu'} close={close}>
          {levels.map((level) => <SettingChoice key={level} label={level} selected={profile.data[panel] === level} onPress={() => save({ [panel]: level })} />)}
          {!!error && <StudyText>{error}</StudyText>}
        </ProfileSheet>
      )}
      {(numeric || panel === 'reminderTime') && (
        <ProfileSheet title={panel === 'minutes' ? 'Mục tiêu học mỗi ngày' : panel === 'streakGoal' ? 'Mục tiêu học liên tiếp' : 'Giờ nhắc học'} close={close}>
          <SettingInput value={draft} onChange={setDraft} numeric={numeric} label={numeric ? 'Mục tiêu' : 'Giờ nhắc học'} />
          <StudyText>{panel === 'minutes' ? 'Từ 5 đến 180 phút' : panel === 'streakGoal' ? 'Từ 1 đến 365 ngày' : 'Định dạng 24 giờ, ví dụ 20:00'}</StudyText>
          <ProfileAction label="Lưu" disabled={!editable || !valid} onPress={() => {
            if (panel === 'minutes') save({ minutes: +draft });
            if (panel === 'streakGoal') save({ streakGoal: +draft });
            if (panel === 'reminderTime') save({ reminderTime: draft });
          }} />
          {!!error && <StudyText>{error}</StudyText>}
        </ProfileSheet>
      )}
      {panel === 'reminderDays' && (
        <ProfileSheet title="Ngày trong tuần" close={close}>
          <SettingChoice label="Tất cả" selected={selectedDays.length === days.length} onPress={() => setDays(days.map(({ value }) => value))} />
          {days.map(({ value, label }) => <SettingChoice key={value} label={label} selected={selectedDays.includes(value)}
            onPress={() => setDays((selected) => selected.includes(value) ? selected.filter((day) => day !== value) : [...selected, value])} />)}
          <ProfileAction label="Lưu" disabled={!editable || selectedDays.length === 0} onPress={() => save({ reminderDays: [...selectedDays].sort((left, right) => left - right) })} />
          {!!error && <StudyText>{error}</StudyText>}
        </ProfileSheet>
      )}
    </StudyScreen>
  );
}

export function ProfileSecurity() {
  const profile = useLearnerProfile();
  const [panel, setPanel] = useState<'devices' | 'password' | 'delete'>();
  const [error, setError] = useState('');
  return (
    <StudyScreen title="Bảo mật tài khoản" back="/settings" largeTitle>
      <View style={styles.list}>
        {env.demoMode && <>
          <ProfileMenuRow title="Đổi mật khẩu" icon={icons.lock} onPress={() => setPanel('password')} />
          <ProfileMenuRow title="Xác thực 2 bước (2FA)" subtitle="Tăng cường bảo mật tài khoản" icon={icons.shield}
            end={<SettingSwitch label="Xác thực 2 bước trong demo" value={profile.data.demoTwoFactorEnabled}
              disabled={!profile.query.isSuccess || profile.saving} onChange={(value) => {
                setError('');
                void profile.save({ demoTwoFactorEnabled: value }).catch(() => setError('Chưa lưu được lựa chọn.'));
              }} />} />
          <ProfileMenuRow title="Số điện thoại" icon={icons.phone} value="Chưa liên kết" />
        </>}
        <ProfileMenuRow title="Email" subtitle={profile.user.data?.email ?? 'Đang tải email…'} icon={icons.email}
          end={profile.user.data?.email ? <SettingCheck /> : undefined} />
        <ProfileMenuRow title="Phiên đăng nhập" subtitle="Xem thiết bị đang đăng nhập" icon={icons.devices} onPress={() => setPanel('devices')} />
      </View>
      {env.demoMode && <ProfileMenuRow title="Xóa tài khoản" subtitle="Xem trước thao tác trong bản demo" icon={icons.trash} tone="danger" onPress={() => setPanel('delete')} />}
      {!!error && <StudyText>{error}</StudyText>}
      {panel === 'devices' && <CurrentSession close={() => setPanel(undefined)} />}
      {(panel === 'password' || panel === 'delete') && (
        <ProfileSheet title={panel === 'password' ? 'Đổi mật khẩu' : 'Xóa tài khoản'} close={() => setPanel(undefined)}>
          <StudyText>Thao tác này đang ở chế độ xem trước.</StudyText>
          <ProfileAction label="Đóng" onPress={() => setPanel(undefined)} />
        </ProfileSheet>
      )}
    </StudyScreen>
  );
}

function CurrentSession({ close }: { close: () => void }) {
  const { handleLogout, logoutPending } = useLogout();
  const device = Platform.OS === 'ios' ? 'iPhone hoặc iPad' : Platform.OS === 'android' ? 'Android' : 'Trình duyệt';
  return (
    <ProfileSheet title="Quản lý thiết bị" close={close}>
      <ProfileMenuRow title={device} subtitle="Thiết bị hiện tại" icon={icons.devices} end={<SettingCheck />} />
      <ProfileAction label={logoutPending ? 'Đang đăng xuất…' : 'Đăng xuất'} disabled={logoutPending} onPress={() => void handleLogout()} />
    </ProfileSheet>
  );
}

function SettingCheck() {
  const colors = useStudyColors();
  return <StudyIcon name={icons.check} size={18} color={colors.green} />;
}

function SettingChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress}
      style={({ pressed }) => [styles.choice, { backgroundColor: selected ? colors.iconFill : colors.surface, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[styles.choiceLabel, { color: colors.title }]}>{label}</Text>
      {selected && <SettingCheck />}
    </Pressable>
  );
}

function SettingInput({ value, label, numeric, onChange }: { value: string; label: string; numeric: boolean; onChange: (text: string) => void }) {
  const colors = useStudyColors();
  return <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={numeric ? 3 : 5}
    keyboardType={numeric ? 'number-pad' : 'numbers-and-punctuation'} selectTextOnFocus
    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} />;
}

function SettingSwitch({ label, value, disabled, onChange }: { label: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  const colors = useStudyColors();
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }}
      disabled={disabled} onPress={() => onChange(!value)} hitSlop={8}
      style={[styles.switchTrack, { backgroundColor: value ? studyColors.light.icon : colors.track, opacity: disabled ? 0.6 : 1 }]}>
      <View style={[styles.switchThumb, value && styles.switchChecked]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  choice: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, minHeight: 48, paddingHorizontal: 13, gap: 10 },
  choiceLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  switchTrack: { width: 43, height: 25, borderRadius: 13, justifyContent: 'center', padding: 2 },
  switchThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#FFFFFF', boxShadow: '0px 1px 3px #10284642' },
  switchChecked: { alignSelf: 'flex-end' },
  input: { minHeight: 46, paddingHorizontal: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, fontSize: 17 },
});
