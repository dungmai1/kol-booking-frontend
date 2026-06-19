import type { ApiResponse, AuthTokens } from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

/** Turn backend-relative upload paths (`/uploads/...`) into absolute URLs for display. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    try {
      return `${new URL(API_BASE_URL).origin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

/** Accept absolute links or backend upload paths returned from `/files/upload`. */
export function isValidContentUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return trimmed.startsWith('/uploads/');
}

const TOKEN_KEY = 'kol_access_token';
const REFRESH_KEY = 'kol_refresh_token';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>): void {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const json: ApiResponse<AuthTokens> = await res.json();
    if (json.success && json.data) {
      saveTokens(json.data);
      return json.data.accessToken;
    }
  } catch {
    // network error
  }
  clearTokens();
  return null;
}

/**
 * Refresh the access token if it has become invalid (401).
 * Joins an in-flight refresh so only one HTTP round-trip is made
 * even when multiple callers (SSE hook + regular API) hit 401 simultaneously.
 * Returns the new access token on success, or null if refresh failed.
 */
export async function refreshIfExpired(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise<string | null>((resolve) => {
      refreshQueue.push(resolve);
    });
  }
  isRefreshing = true;
  const newToken = await refreshAccessToken();
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
  isRefreshing = false;
  return newToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Public auth routes where 401 means invalid input/credentials, not an expired session. */
function isPublicAuthPath(path: string): boolean {
  return (
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    path === '/auth/verify-email' ||
    path === '/auth/resend-verification'
  );
}

async function errorFromResponse(res: Response): Promise<ApiError> {
  try {
    const json: ApiResponse<unknown> = await res.json();
    if (!json.success) {
      return new ApiError(res.status, json.errorCode, json.message ?? 'Đã xảy ra lỗi');
    }
  } catch {
    // non-JSON or empty body
  }
  return new ApiError(res.status, 'UNAUTHORIZED', 'Phiên đăng nhập hết hạn');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
  skipContentType = false,
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    ...(!skipContentType && { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // Handle 401 with token refresh (skip for public auth routes and when no refresh token)
  if (res.status === 401 && retry) {
    if (isPublicAuthPath(path) || !getRefreshToken()) {
      throw await errorFromResponse(res);
    }

    let newToken: string | null = null;

    if (isRefreshing) {
      newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
    } else {
      isRefreshing = true;
      newToken = await refreshAccessToken();
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      isRefreshing = false;
    }

    if (newToken) {
      return request<T>(path, options, false, skipContentType);
    }

    // Refresh failed – redirect to login (skip if already on a public auth page)
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isPublicAuthPage =
        pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/register') ||
        pathname.startsWith('/auth/check-email') ||
        pathname.startsWith('/auth/verify-email') ||
        pathname.startsWith('/auth/email-verified') ||
        pathname.startsWith('/auth/forgot-password') ||
        pathname.startsWith('/reset-password');
      if (!isPublicAuthPage) {
        window.location.href = '/auth/login';
      }
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Phiên đăng nhập hết hạn');
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(res.status, json.errorCode, json.message ?? 'Đã xảy ra lỗi');
  }

  return json.data as T;
}

// ─── HTTP method helpers ──────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /** multipart/form-data upload — skips Content-Type so browser sets boundary */
  upload<T>(path: string, formData: FormData): Promise<T> {
    return request<T>(path, { method: 'POST', body: formData }, true, true);
  },

  /** Build query string from params object, skipping undefined/null values */
  buildQuery(params: Record<string, unknown>): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => qs.append(key, String(v)));
      } else {
        qs.set(key, String(value));
      }
    }
    const str = qs.toString();
    return str ? `?${str}` : '';
  },
};
