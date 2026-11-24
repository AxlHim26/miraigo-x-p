import Head from 'expo-router/head';
import { useLocalSearchParams } from 'expo-router';

import { pickSearchParam } from '@/features/web/auth/redirect';
import VerifyEmailView from '@/features/web/auth/verify-email-view';

export default function WebVerifyEmailScreen() {
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  return (
    <>
      <Head><title>MiraiGo | Kích hoạt tài khoản</title></Head>
      <VerifyEmailView key={pickSearchParam(token)} token={pickSearchParam(token)} email={pickSearchParam(email)} />
    </>
  );
}
