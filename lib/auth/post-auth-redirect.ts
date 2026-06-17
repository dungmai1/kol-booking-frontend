import type { Role } from '@/lib/api/types';

/** Dashboard path after email verification redirect from backend. */
export function getPostAuthRedirectPath(role: Role): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'KOL') return '/kol-dashboard/me';
  return '/';
}
