export function pickSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function isSafeRedirect(value: string | null): value is string {
  return !!value && value.startsWith('/') && !value.startsWith('//') && !/[\s\\]/.test(value);
}

export function resolveRedirectTarget(value: string | null) {
  return isSafeRedirect(value) ? value : '/courses';
}

export function createAuthRouteWithParams(
  pathname: '/login' | '/register' | '/register/check-email',
  redirect: string | null,
  params: Record<string, string | number | null | undefined> = {},
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') query.set(key, String(value));
  }
  if (isSafeRedirect(redirect)) query.set('redirect', redirect);
  return query.size ? `${pathname}?${query}` : pathname;
}

export const createAuthRoute = createAuthRouteWithParams;
