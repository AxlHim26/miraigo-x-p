import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import CheckEmailView from '@/features/web/auth/check-email-view';
import { pickSearchParam } from '@/features/web/auth/redirect';

export default function WebCheckEmailScreen() {
  const { email, redirect, expires, resent } = useLocalSearchParams<{
    email?: string;
    redirect?: string;
    expires?: string;
    resent?: string;
  }>();
  return (
    <>
      <Head><title>MiraiGo | Xác nhận email</title></Head>
      <CheckEmailView
        key={pickSearchParam(email)}
        email={pickSearchParam(email)}
        redirectParam={pickSearchParam(redirect)}
        expires={pickSearchParam(expires)}
        resent={pickSearchParam(resent) === '1'}
      />
    </>
  );
}
