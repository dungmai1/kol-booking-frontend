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
import type { AuthTokens, LoginRequest, RegisterRequest, Role } from '@/lib/api/types';

interface AuthUser {
  userId: number;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<AuthTokens>;
  register: (data: RegisterRequest) => Promise<AuthTokens>;
  logout: () => Promise<void>;
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
  return {
    userId: payload.userId as number,
    email: payload.sub as string,
    role: payload.role as Role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user from stored token
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const parsed = userFromToken(token);
      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<AuthTokens> => {
    const tokens = await authApi.login(data);
    setUser({ userId: tokens.userId, email: tokens.email, role: tokens.role });
    return tokens;
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<AuthTokens> => {
    const tokens = await authApi.register(data);
    saveTokens(tokens);
    setUser({ userId: tokens.userId, email: tokens.email, role: tokens.role });
    return tokens;
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
