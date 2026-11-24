import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerCanvas, LearnerControl, LearnerGlyph, LearnerHeading, LearnerPanel, LearnerSectionHeading } from '@/components/ui/learner-glass';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

export function AccountScreen() {
  const router = useRouter();
  const { handleLogout, logoutPending } = useLogout();
  const profile = useCurrentUser(!logoutPending);
  const user = profile.isSuccess && !logoutPending ? profile.data : null;

  return (
    <LearnerCanvas>
      <LearnerHeading eyebrow="MIRAI GO" title="Tài khoản" description="Quản lý tùy chọn ứng dụng và phiên đăng nhập của bạn." />
      <LearnerPanel>
        <View style={styles.profile}>
          <LearnerGlyph glyph={user?.username ? Array.from(user.username)[0].toUpperCase() : '日'} />
          <View style={styles.profileText}>
            <ThemedText accessibilityRole="header" style={styles.profileTitle}>{user?.username || 'Hồ sơ MiraiGo'}</ThemedText>
            {user?.email && <ThemedText type="small" themeColor="textSecondary" selectable>{user.email}</ThemedText>}
            {profile.isPending && !logoutPending && <ThemedText type="small" themeColor="textSecondary">Đang tải hồ sơ…</ThemedText>}
            {profile.isError && !logoutPending && <ThemedText type="small" themeColor="textSecondary">Chưa tải được hồ sơ.</ThemedText>}
          </View>
        </View>
        {profile.isError && !logoutPending && <LearnerControl label="Tải lại hồ sơ" disabled={profile.isFetching} onPress={() => void profile.refetch()} style={styles.action} />}
        <LearnerControl label="Cài đặt" glyph="⚙" tone="accent" onPress={() => router.navigate('/settings')} style={styles.action} />
      </LearnerPanel>
      <LearnerSectionHeading title="Phiên đăng nhập" />
      <LearnerPanel>
        <ThemedText type="small" themeColor="textSecondary">Bạn có thể đăng nhập lại bất cứ lúc nào.</ThemedText>
        <LearnerControl
          label={logoutPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
          glyph="↪"
          tone="danger"
          disabled={logoutPending}
          accessibilityState={{ busy: logoutPending }}
          onPress={handleLogout}
          style={styles.action}
        />
      </LearnerPanel>
    </LearnerCanvas>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileText: { flex: 1, gap: 4 },
  profileTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800' },
  action: { alignSelf: 'flex-start', maxWidth: '100%' },
});
