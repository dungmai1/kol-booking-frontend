import { api, saveTokens, clearTokens } from './client';
import type {
  AuthTokens,
  MeResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
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
    clearTokens();
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

  verifyEmail(data: VerifyEmailRequest): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/verify-email', data);
  },

  /**
   * Re-sends the verification link. The backend always returns success (to avoid
   * leaking which emails exist), so the UI should show a neutral confirmation.
   */
  resendVerification(data: ResendVerificationRequest): Promise<void> {
    return api.post('/auth/resend-verification', data);
  },

  forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return api.post('/auth/forgot-password', data);
  },

  resetPassword(data: ResetPasswordRequest): Promise<void> {
    return api.post('/auth/reset-password', data);
  },
};
