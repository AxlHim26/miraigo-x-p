import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import {
  AuthBrand,
  AuthButton,
  AuthField,
  AuthHeading,
  AuthLink,
  AuthMessage,
  AuthScreen,
} from '@/features/auth/components/auth-screen';
import {
  confirmEmailVerification,
  resendEmailVerification,
} from '@/features/auth/services/auth-service';
import { env } from '@/core/config/env';
import { authStorage } from '@/integrations/auth/auth-storage';
import { ApiError } from '@/shared/utils/api-error';

export function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; expires?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const [token, setToken] = useState(env.demoMode ? 'MIRAIGO' : '');
  const verifyMutation = useMutation({
    mutationFn: () => confirmEmailVerification(token.trim()),
    onSuccess: async ({ token: accessToken }) => {
      if (!env.demoMode) await authStorage.setAccessToken(accessToken);
      router.replace('/');
    },
  });
  const resendMutation = useMutation({ mutationFn: () => resendEmailVerification(email) });

  return (
    <AuthScreen>
      <AuthBrand />
      <AuthHeading
        title="Xác minh email"
        subtitle={env.demoMode ? 'Mã xác minh mẫu là MIRAIGO.' : email ? `Nhập mã xác minh trong email gửi đến ${email}.` : 'Mở liên kết xác minh trong email để kích hoạt tài khoản.'}
      />
      {params.expires ? (
        <Text style={{ color: '#69758A', fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
          Mã có hiệu lực trong khoảng {params.expires} phút.
        </Text>
      ) : null}
      {verifyMutation.isError ? (
        <AuthMessage
          message={verifyMutation.error instanceof ApiError ? verifyMutation.error.message : 'Không thể xác minh email.'}
        />
      ) : null}
      {verifyMutation.isSuccess ? <AuthMessage message="Email đã được xác minh." tone="success" /> : null}
      <AuthField
        label="Mã xác minh"
        placeholder="Dán mã từ email"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AuthButton
        title="Xác minh và đăng nhập"
        pending={verifyMutation.isPending}
        disabled={!token.trim()}
        onPress={() => verifyMutation.mutate()}
      />
      {email && !env.demoMode ? (
        <Text
          onPress={() => resendMutation.mutate()}
          style={{ color: '#3D73F3', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 18 }}>
          {resendMutation.isPending ? 'Đang gửi lại…' : 'Gửi lại email xác minh'}
        </Text>
      ) : null}
      {resendMutation.isSuccess ? (
        <AuthMessage message="Đã gửi lại email xác minh." tone="success" />
      ) : null}
      {resendMutation.isError ? (
        <AuthMessage
          message={resendMutation.error instanceof ApiError ? resendMutation.error.message : 'Gửi lại email thất bại.'}
        />
      ) : null}
      <AuthLink prompt="Đã xác minh rồi?" label="Đăng nhập" href="/login" />
    </AuthScreen>
  );
}
