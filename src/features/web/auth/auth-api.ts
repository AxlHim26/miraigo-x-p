import {
  authenticate as signIn,
  confirmEmailVerification as confirmEmail,
  resendEmailVerification as resendEmail,
} from '@/features/auth/services/auth-service';

export { registerAccount } from '@/features/auth/services/auth-service';

export function authenticate({ username, password }: { username: string; password: string }) {
  return signIn(username, password);
}

export function confirmEmailVerification({ token }: { token: string }) {
  return confirmEmail(token);
}

export function resendEmailVerification({ email }: { email: string }) {
  return resendEmail(email);
}
