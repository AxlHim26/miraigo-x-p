import Head from 'expo-router/head';
import { useLocalSearchParams } from 'expo-router';

import RegisterForm from '@/features/web/auth/register-form';
import { pickSearchParam } from '@/features/web/auth/redirect';

export default function WebRegisterScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  return (
    <>
      <Head><title>MiraiGo | Tạo tài khoản</title></Head>
      <RegisterForm redirectParam={pickSearchParam(redirect)} />
    </>
  );
}
