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
import { registerAccount } from '@/features/auth/services/auth-service';
import { ApiError } from '@/shared/utils/api-error';

export function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  const mutation = useMutation({
    mutationFn: () => registerAccount({ username: username.trim(), email: email.trim(), password }),
    onSuccess: ({ email: registeredEmail, expiresInMinutes }) => {
      router.replace({
        pathname: '/verify-email',
        params: { email: registeredEmail, expires: String(expiresInMinutes) },
      });
    },
  });

  const canSubmit = Boolean(
    username.trim().length >= 3 &&
      username.trim().length <= 50 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      password.length >= 6 &&
      confirmPassword &&
      !passwordMismatch,
  );

  return (
    <AuthScreen>
      <AuthBrand />
      {mutation.isError ? (
        <AuthMessage
          message={
            mutation.error instanceof ApiError
              ? mutation.error.message
              : 'Tạo tài khoản thất bại. Vui lòng kiểm tra lại thông tin.'
          }
        />
      ) : null}
      <AuthField
        label="Tên đăng nhập"
        placeholder="Từ 3 đến 50 ký tự"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
      />
      <AuthField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <AuthField
        label="Mật khẩu"
        placeholder="Ít nhất 6 ký tự"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <AuthField
        label="Xác nhận mật khẩu"
        placeholder="Nhập lại mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {passwordMismatch ? <AuthMessage message="Mật khẩu xác nhận chưa khớp." /> : null}
      {password.length > 0 && password.length < 6 ? (
        <AuthMessage message="Mật khẩu cần có ít nhất 6 ký tự." />
      ) : null}
      <AuthButton
        title="Tạo tài khoản"
        pending={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
      <AuthLink prompt="Đã có tài khoản?" label="Đăng nhập" href="/login" />
    </AuthScreen>
  );
}
