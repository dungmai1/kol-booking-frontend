import { api, saveTokens, clearTokens } from './client';
import type {
  AuthTokens,
  MeResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './types';

export const authApi = {
  getMe(): Promise<MeResponse> {
    return api.get<MeResponse>('/users/me');
  },

  register(data: RegisterRequest): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/register', data);
  },

  async login(data: LoginRequest): Promise<AuthTokens> {
    const tokens = await api.post<AuthTokens>('/auth/login', data);
    saveTokens(tokens);
    return tokens;
  },

  async refresh(data: RefreshTokenRequest): Promise<AuthTokens> {
    const tokens = await api.post<AuthTokens>('/auth/refresh', data);
    saveTokens(tokens);
    return tokens;
  },

  async logout(data: LogoutRequest): Promise<void> {
    await api.post('/auth/logout', data);
    clearTokens();
  },

  verifyEmail(data: VerifyEmailRequest): Promise<void> {
    return api.post('/auth/verify-email', data);
  },

  forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return api.post('/auth/forgot-password', data);
  },

  resetPassword(data: ResetPasswordRequest): Promise<void> {
    return api.post('/auth/reset-password', data);
  },
};
