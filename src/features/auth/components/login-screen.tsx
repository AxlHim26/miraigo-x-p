import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import {
  AuthBrand,
  AuthButton,
  AuthField,
  AuthLink,
  AuthMessage,
  AuthScreen,
} from '@/features/auth/components/auth-screen';
import { env } from '@/core/config/env';
import { authenticate } from '@/features/auth/services/auth-service';
import { authStorage } from '@/integrations/auth/auth-storage';
import { ApiError } from '@/shared/utils/api-error';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => authenticate(username.trim(), password),
    onSuccess: async ({ token }) => {
      if (!env.demoMode) await authStorage.setAccessToken(token);
      router.replace('/');
    },
  });

  return (
    <AuthScreen>
      <AuthBrand />
      {env.demoMode && <AuthButton title="Mở bản demo" onPress={() => router.replace('/')} />}
      {mutation.isError ? (
        <AuthMessage
          message={
            mutation.error instanceof ApiError
              ? mutation.error.message
              : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
          }
        />
      ) : null}
      <AuthField
        label="Tên đăng nhập"
        placeholder="Nhập tên đăng nhập"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
      />
      <AuthField
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => mutation.mutate()}
      />
      <AuthButton
        title="Đăng nhập"
        pending={mutation.isPending}
        disabled={!username.trim() || !password}
        onPress={() => mutation.mutate()}
      />
      <AuthLink prompt="Chưa có tài khoản?" label="Đăng ký ngay" href="/register" />
    </AuthScreen>
  );
}
