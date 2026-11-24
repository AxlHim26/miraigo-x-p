import { Redirect } from 'expo-router';
import { env } from '@/core/config/env';
import { LoginScreen } from '@/features/auth/components/login-screen';

export default function LoginRoute() {
  return env.autoLogin ? <Redirect href="/" /> : <LoginScreen />;
}
