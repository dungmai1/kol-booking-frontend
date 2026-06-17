import type { AuthTokens, Role } from '@/lib/api/types';

const VALID_ROLES: Role[] = ['ADMIN', 'BRAND', 'KOL'];

/** Parse JWT session fields returned by backend in the URL hash after email verification. */
export function parseHashAuthTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const email = params.get('email');
  const role = params.get('role') as Role | null;
  const userId = Number(params.get('userId'));
  const expiresIn = Number(params.get('expiresIn') ?? params.get('accessTokenExpiresInSeconds'));

  if (!accessToken || !refreshToken || !email || !role || !VALID_ROLES.includes(role) || !userId) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    email: decodeURIComponent(email),
    role,
    userId,
    accessTokenExpiresInSeconds: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 900,
  };
}
