import { parseHashAuthTokens } from '@/lib/auth/parse-hash-tokens';

/** Read email-verification token from query string or URL hash (mobile-safe fallbacks). */
export function parseEmailVerificationToken(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get('token')?.trim();
  if (fromQuery) return fromQuery;

  if (typeof window === 'undefined') return null;

  const fromWindowSearch = new URLSearchParams(window.location.search).get('token')?.trim();
  if (fromWindowSearch) return fromWindowSearch;

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const hashParams = new URLSearchParams(hash);
  const fromHash = hashParams.get('token')?.trim();
  return fromHash || null;
}

/** True when the URL already carries a full session from backend redirect. */
export function hasHashAuthSession(): boolean {
  return parseHashAuthTokens() !== null;
}
