import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { LearnerLoadState } from '@/components/ui/learner-detail';
import { StudyIcon, studySymbol } from '@/components/ui/study-icon';
import { StudyChevron, StudyCover, StudyLinkRow, StudyShortcut } from '@/components/ui/study-navigation';
import { StudyActionButton, StudyIconButton, StudyPanel, StudyPills, StudyProgressBar, StudyRing, StudyScreen, StudyText, useStudyColors } from '@/components/ui/study-screen';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { avatarUri, pickProfilePhoto } from '@/features/auth/profile/profile-image';
import { genders, levels, useLearnerProfile } from '@/features/auth/profile/use-learner-profile';
import { useCourseLearning } from '@/features/courses/hooks/use-course-learning';
import type { Course } from '@/features/courses/services/course-service';
import { courseLevel, courseMediaHref, courseProgressHref } from '@/features/courses/utils/course-navigation';
import { orderedLessons } from '@/features/courses/utils/course-outline';
import { useDailyStudy } from '@/features/home/hooks/use-daily-study';
import { useHomeData } from '@/features/home/hooks/use-home-data';
import { studyWeek, useStudyTime } from '@/features/home/hooks/use-study-time';
import { vocabularySessionHref } from '@/features/vocabulary/data/vocabulary-study';

const icons = {
  person: studySymbol('person', 'person'),
  chart: studySymbol('chart.bar', 'bar_chart'),
  trophy: studySymbol('trophy', 'emoji_events'),
  bookmark: studySymbol('bookmark', 'bookmark_border'),
  crown: studySymbol('crown', 'workspace_premium'),
  settings: studySymbol('gearshape', 'settings'),
  book: studySymbol('book', 'menu_book'),
  photo: studySymbol('photo', 'image'),
  bell: studySymbol('bell', 'notifications'),
};
const assets = {
  fuji: require('@/assets/images/listening-fuji.jpg') as number,
  room: require('@/assets/images/lesson-room-cover.jpg') as number,
  audio: require('@/assets/images/listening-headphones.jpg') as number,
};
const profileLinks = [
  ['Hồ sơ', icons.person, '/account/profile'], ['Tiến độ học', icons.chart, '/account/study-progress'], ['Thành tích', icons.trophy, '/account/achievements'],
  ['Đã lưu', icons.bookmark, '/account/saved'], ['Gói nâng cấp', icons.crown, '/account/upgrade'], ['Cài đặt', icons.settings, '/settings'],
] as const satisfies readonly (readonly [string, typeof icons.person, Href])[];

function ProfileAvatar({ avatar, size = 68 }: { avatar: string; size?: number }) {
  const colors = useStudyColors();
  const asset = Object.prototype.hasOwnProperty.call(assets, avatar) ? assets[avatar as keyof typeof assets] : undefined;
  const uri = avatarUri(avatar);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.iconFill }]}>
      {asset || uri
        ? <Image source={asset ?? { uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        : <StudyIcon name={icons.person} color={colors.icon} size={size * 0.48} />}
    </View>
  );
}

export function ProfileHome() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const { handleLogout, logoutPending } = useLogout();
  const username = profile.user.data?.username;
  const name = profile.data.displayName || profile.data.name || username || 'Hồ sơ MiraiGo';
  return (
    <StudyScreen title="Cá nhân" action={<StudyIconButton icon={icons.bell} label="Hoạt động học tập" onPress={() => router.push('/practice/plan')} />}>
      <LearnerLoadState pending={profile.user.isPending && !logoutPending} error={logoutPending ? null : profile.user.error}
        retry={() => void profile.user.refetch()} />
      <StudyPanel>
        <Pressable accessibilityRole="link" accessibilityLabel="Chỉnh sửa hồ sơ" onPress={() => router.push('/account/profile')} style={styles.identity}>
          <ProfileAvatar avatar={profile.data.avatar} />
          <View style={styles.copy}><StudyText heading>{name}</StudyText>{profile.user.data?.email && <StudyText>{profile.user.data.email}</StudyText>}</View>
          <StudyChevron />
        </Pressable>
      </StudyPanel>
      <StudyCover title={profile.data.currentLevel} subtitle="Cấp độ hiện tại" onPress={() => router.push('/account/learning')} />
      {[profileLinks.slice(0, 3), profileLinks.slice(3)].map((links, index) => (
        <View key={index} style={styles.row}>
          {links.map(([label, icon, href]) => <StudyShortcut key={label} label={label} icon={icon} onPress={() => router.push(href)} />)}
        </View>
      ))}
      <StudyActionButton label={logoutPending ? 'Đang đăng xuất…' : 'Đăng xuất'} secondary disabled={logoutPending} onPress={() => void handleLogout()} />
    </StudyScreen>
  );
}

function ProfileField({ label, value, onChangeText, placeholder }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
}) {
  const colors = useStudyColors();
  return <View style={styles.field}><StudyText>{label}</StudyText>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={colors.secondary}
      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} /></View>;
}

function ProfileForm({ profile }: { profile: ReturnType<typeof useLearnerProfile> }) {
  const router = useRouter();
  const [name, setName] = useState(profile.data.name || profile.user.data?.username || '');
  const [displayName, setDisplayName] = useState(profile.data.displayName);
  const [gender, setGender] = useState(profile.data.gender);
  const [birthDate, setBirthDate] = useState(profile.data.birthDate);
  const [goal, setGoal] = useState(profile.data.goal);
  const [error, setError] = useState('');
  async function save() {
    setError('');
    try {
      if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || new Date(birthDate) > new Date())) {
        setError('Nhập ngày sinh theo dạng năm-tháng-ngày.');
        return;
      }
      await profile.save({ name: name.trim(), displayName: displayName.trim(), birthDate, gender, goal });
      router.dismissTo('/account');
    } catch { setError('Không lưu được hồ sơ. Hãy kiểm tra ngày sinh và độ dài tên.'); }
  }
  return (
    <StudyScreen title="Chỉnh sửa hồ sơ" back="/account" footer={<StudyActionButton label="Lưu thay đổi" disabled={profile.saving} onPress={() => void save()} />}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đổi ảnh đại diện" onPress={() => router.push('/account/avatar')} style={styles.center}>
        <ProfileAvatar avatar={profile.data.avatar} size={86} /><StudyText>Đổi ảnh đại diện</StudyText>
      </Pressable>
      <ProfileField label="Họ và tên" value={name} onChangeText={setName} />
      <ProfileField label="Tên hiển thị" value={displayName} onChangeText={setDisplayName} />
      <StudyText>Giới tính</StudyText>
      <StudyPills options={[...genders]} current={gender} onSelect={setGender} />
      <ProfileField label="Ngày sinh" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
      <StudyText>Cấp độ mục tiêu</StudyText>
      <StudyPills options={[...levels]} current={goal} onSelect={setGoal} />
      {error ? <StudyText>{error}</StudyText> : null}
    </StudyScreen>
  );
}

export function ProfileEdit() {
  const profile = useLearnerProfile();
  return profile.query.isSuccess ? <ProfileForm profile={profile} /> : (
    <StudyScreen title="Chỉnh sửa hồ sơ" back="/account">
      <LearnerLoadState pending={profile.query.isPending} error={profile.query.error} retry={() => void profile.query.refetch()} />
    </StudyScreen>
  );
}

export function ProfileAvatarEdit() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const [selection, select] = useState<string>();
  const [error, setError] = useState('');
  const active = selection ?? profile.data.avatar;
  return (
    <StudyScreen title="Đổi ảnh đại diện" back="/account/profile" footer={<StudyActionButton label="Áp dụng" disabled={!profile.query.isSuccess || profile.saving}
      onPress={() => void profile.save({ avatar: active }).then(() => router.dismissTo('/account/profile'), () => setError('Chưa lưu được ảnh.'))} />}>
      <View style={styles.center}><ProfileAvatar avatar={active} size={112} /></View>
      {Platform.OS !== 'web' && <StudyActionButton secondary icon={icons.photo} label="Chọn ảnh trên thiết bị" onPress={() => {
        setError('');
        void pickProfilePhoto().then((file) => { if (file) select(file); }, () => setError('Chọn ảnh JPEG, PNG, WebP hoặc HEIC dưới 10 MB.'));
      }} />}
      <StudyText heading>Ảnh gợi ý</StudyText>
      <View style={styles.row}>
        {Object.keys(assets).map((key, index) => <Pressable key={key} accessibilityRole="radio"
          accessibilityLabel={['Núi Phú Sĩ', 'Phòng Nhật Bản', 'Tai nghe'][index]}
          accessibilityState={{ checked: active === key }} onPress={() => select(key)} style={styles.center}>
          <ProfileAvatar avatar={key} size={69} />{active === key && <StudyText>✓</StudyText>}
        </Pressable>)}
      </View>
      {!!error && <StudyText>{error}</StudyText>}
    </StudyScreen>
  );
}

export function ProfileSaved() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const query = useHomeData();
  const [tab, setTab] = useState<'Bài học' | 'Từ vựng' | 'Ngữ pháp'>('Bài học');
  return <StudyScreen title="Đã lưu" back="/account">
    <StudyPills options={['Bài học', 'Từ vựng', 'Ngữ pháp']} current={tab} onSelect={setTab} />
    {tab === 'Bài học' ? (
      <>
        <StudyLinkRow title="Bài đọc đã lưu" icon={icons.book}
          onPress={() => router.push({ pathname: '/practice/reading/library', params: { mode: 'saved', level: profile.data.currentLevel } })} />
        <StudyLinkRow title="Đề JLPT yêu thích" icon={icons.bookmark} onPress={() => router.push('/practice/saved')} />
        <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
        {query.data?.map((course) => <StudyLinkRow key={course.id} title={course.name} subtitle="Video đã lưu" icon={icons.bookmark}
          onPress={() => router.push(courseMediaHref(course.id, 'saved'))} />)}
      </>
    ) : tab === 'Từ vựng'
      ? <StudyLinkRow title="Từ vựng yêu thích" icon={icons.book} onPress={() => router.push(vocabularySessionHref('favorites', profile.data.currentLevel))} />
      : <StudyLinkRow title="Mẫu ngữ pháp yêu thích" icon={icons.book} onPress={() => router.push('/grammar/favorites')} />}
  </StudyScreen>;
}

export function ProfileProgress() {
  const router = useRouter();
  const profile = useLearnerProfile();
  const daily = useDailyStudy();
  const query = useHomeData();
  const { days } = useStudyTime();
  const week = studyWeek(days, false);
  const today = week[(new Date().getDay() + 6) % 7].seconds;
  const total = week.reduce((sum, day) => sum + day.seconds, 0);
  const course = query.data?.find((course) => courseLevel(course) === profile.data.currentLevel);
  const [tab, setTab] = useState<'Tổng quan' | 'Theo kỹ năng' | 'Theo cấp độ'>('Tổng quan');
  return <StudyScreen title="Tiến độ học" back="/account">
    <StudyPills options={['Tổng quan', 'Theo kỹ năng', 'Theo cấp độ']} current={tab} onSelect={setTab} />
    {tab === 'Tổng quan' ? (
      <>
        {course && <CourseAchievement course={course} />}
        <View style={styles.row}>
          <StudyPanel style={styles.copy}><StudyText heading>{daily.streak} ngày</StudyText><StudyText>Học liên tiếp</StudyText></StudyPanel>
          <StudyPanel style={styles.copy}><StudyText heading>{Math.floor(total / 60)} phút</StudyText><StudyText>Học trong tuần</StudyText></StudyPanel>
        </View>
        <StudyPanel>
          <StudyText heading>Mục tiêu hôm nay</StudyText>
          <StudyText>{Math.floor(today / 60)} / {profile.data.minutes} phút</StudyText>
          <StudyProgressBar fraction={today / (profile.data.minutes * 60)} />
        </StudyPanel>
        <WeekBars week={week} />
      </>
    ) : tab === 'Theo kỹ năng' ? (
      <>
        <StudyLinkRow title="Từ vựng" icon={icons.book} onPress={() => router.push('/vocabulary/stats')} />
        <StudyLinkRow title="Luyện nghe" icon={icons.chart} onPress={() => router.push('/practice/listening/stats')} />
        <StudyLinkRow title="Luyện đọc" icon={icons.book} onPress={() => router.push('/practice/reading/stats')} />
      </>
    ) : (
      <>
        <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
        {query.data?.map((item) => <StudyLinkRow key={item.id} title={item.name} icon={icons.chart}
          onPress={() => router.push(courseProgressHref(item.id))} />)}
      </>
    )}
  </StudyScreen>;
}

function WeekBars({ week }: { week: ReturnType<typeof studyWeek> }) {
  const colors = useStudyColors();
  const max = Math.max(1, ...week.map(({ seconds }) => seconds));
  return <StudyPanel><StudyText heading>Tiến độ 7 ngày</StudyText><View style={styles.row}>
    {week.map(({ label, seconds }) => <View key={label} style={styles.barColumn} accessibilityLabel={label + ', ' + Math.floor(seconds / 60) + ' phút'}>
      <View style={[styles.bar, { backgroundColor: colors.blue, height: 4 + 56 * seconds / max }]} /><StudyText>{label}</StudyText>
    </View>)}
  </View></StudyPanel>;
}

function CourseAchievement({ course }: { course: Course }) {
  const learning = useCourseLearning(course.id);
  const entries = orderedLessons(course);
  const completed = entries.filter(({ lesson }) => learning.completed.includes(lesson.id)).length;
  const fraction = entries.length ? completed / entries.length : 0;
  return <StudyPanel>
    <View style={styles.identity}><StudyRing progress={fraction}><StudyText heading>{Math.round(fraction * 100)}%</StudyText></StudyRing>
      <View style={styles.copy}><StudyText heading>{course.name}</StudyText><StudyText>{completed} / {entries.length} bài đã hoàn thành</StudyText></View>
    </View>
  </StudyPanel>;
}

const styles = StyleSheet.create({
  avatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 5 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', gap: 8 },
  field: { gap: 4 },
  input: { paddingHorizontal: 13, minHeight: 42, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, fontSize: 15 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 80, gap: 5 },
  bar: { width: 13, borderRadius: 5 },
});
