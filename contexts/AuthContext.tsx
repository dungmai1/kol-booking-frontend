'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '@/lib/api/auth';
import { getAccessToken, getRefreshToken, clearTokens, saveTokens } from '@/lib/api/client';
import type { AuthTokens, LoginRequest, RegisterRequest, Role, UserStatus } from '@/lib/api/types';

interface AuthUser {
  userId: number;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<AuthTokens & { emailVerified: boolean }>;
  register: (data: RegisterRequest) => Promise<AuthTokens>;
  logout: () => Promise<void>;
  markEmailVerified: () => void;
  /** Save tokens after backend redirect (e.g. /auth/email-verified#accessToken=...). */
  establishSessionFromTokens: (tokens: AuthTokens, emailVerified?: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Decode JWT payload without external library
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function userFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const rawEmail = payload.email ?? payload.sub;
  // Guard: if `sub` is the numeric userId (not an email), don't use it as email.
  const email =
    typeof rawEmail === 'string' && rawEmail.includes('@') ? rawEmail : '';
  const userId =
    typeof payload.userId === 'number'
      ? payload.userId
      : typeof payload.sub === 'number'
        ? (payload.sub as number)
        : Number(payload.userId ?? payload.sub) || 0;
  return {
    userId,
    email,
    role: payload.role as Role,
    status: 'ACTIVE',
    emailVerified: false, // JWT doesn't include this; getMe() will set the real value
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user from stored token, then verify with /users/me
  // to get authoritative email/role (JWT `sub` may be userId, not email).
  useEffect(() => {
    let cancelled = false;
    const initialToken = getAccessToken();
    if (!initialToken) {
      setIsLoading(false);
      return;
    }
    const parsed = userFromToken(initialToken);
    if (parsed) setUser(parsed);
    authApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setUser({
          userId: me.id,
          email: me.email,
          role: me.role,
          status: me.status,
          emailVerified: me.emailVerified,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Ignore stale-session cleanup if the user logged in while validation was in flight.
        if (getAccessToken() === initialToken) {
          clearTokens();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<AuthTokens & { emailVerified: boolean }> => {
    const tokens = await authApi.login(data);
    let emailVerified = false;
    let status: UserStatus = 'ACTIVE';
    try {
      const me = await authApi.getMe();
      emailVerified = me.emailVerified;
      status = me.status;
    } catch { /* fallback to defaults */ }
    setUser({
      userId: tokens.userId,
      email: tokens.email,
      role: tokens.role,
      status,
      emailVerified,
    });
    return { ...tokens, emailVerified };
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<AuthTokens> => {
    const tokens = await authApi.register(data);
    saveTokens(tokens);
    setUser({
      userId: tokens.userId,
      email: tokens.email,
      role: tokens.role,
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
    });
    return tokens;
  }, []);

  const markEmailVerified = useCallback(() => {
    setUser((prev) =>
      prev
        ? { ...prev, emailVerified: true, status: prev.status === 'PENDING_VERIFICATION' ? 'ACTIVE' : prev.status }
        : null,
    );
  }, []);

  const establishSessionFromTokens = useCallback((tokens: AuthTokens, emailVerified = true) => {
    saveTokens(tokens);
    setUser({
      userId: tokens.userId,
      email: tokens.email,
      role: tokens.role,
      status: 'ACTIVE',
      emailVerified,
    });
    authApi
      .getMe()
      .then((me) => {
        setUser({
          userId: me.id,
          email: me.email,
          role: me.role,
          status: me.status,
          emailVerified: me.emailVerified,
        });
      })
      .catch(() => {});
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken });
      } catch {
        // ignore errors on logout
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        markEmailVerified,
        establishSessionFromTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
