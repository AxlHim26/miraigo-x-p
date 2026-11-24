import Head from 'expo-router/head';
import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
import { env } from '@/core/config/env';

import LoginForm from '@/features/web/auth/login-form';
import { pickSearchParam, resolveRedirectTarget } from '@/features/web/auth/redirect';

export default function WebLoginScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  if (env.autoLogin) return <Redirect href={resolveRedirectTarget(pickSearchParam(redirect)) as Href} />;
  return (
    <>
      <Head><title>MiraiGo | Đăng nhập</title></Head>
      <LoginForm redirectParam={pickSearchParam(redirect)} />
    </>
  );
}
