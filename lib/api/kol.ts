import { api } from './client';
import type {
  KolProfileResponse,
  KolPublicResponse,
  KolSummaryResponse,
  KolSocialChannelResponse,
  KolPricingPackageResponse,
  KolPortfolioItemResponse,
  UpdateKolProfileRequest,
  CreateChannelRequest,
  CreatePackageRequest,
  CreatePortfolioItemRequest,
  KolSearchParams,
  PageResponse,
  Platform,
} from './types';

const PLATFORM_VALUES: readonly Platform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];

/**
 * Backend `Platform` enum is case-sensitive UPPERCASE (e.g. FACEBOOK).
 * Defensive normalizer: accepts any casing ("facebook", "Facebook", "FACEBOOK")
 * and returns the canonical enum string the backend expects.
 * Throws on unknown values so we fail loudly during dev instead of sending a 400.
 */
export function normalizePlatform(value: string): Platform {
  const upper = value.trim().toUpperCase();
  if ((PLATFORM_VALUES as readonly string[]).includes(upper)) {
    return upper as Platform;
  }
  throw new Error(`Unknown platform: "${value}"`);
}

export const kolApi = {
  // ─── My Profile ─────────────────────────────────────────────────────────────

  getMyProfile(): Promise<KolProfileResponse> {
    return api.get('/kols/me');
  },

  updateMyProfile(data: UpdateKolProfileRequest): Promise<KolProfileResponse> {
    return api.put('/kols/me', data);
  },

  submitProfile(): Promise<KolProfileResponse> {
    return api.post('/kols/me/submit');
  },

  // ─── Public Profile ──────────────────────────────────────────────────────────

  getPublicProfile(slug: string): Promise<KolPublicResponse> {
    return api.get(`/kols/${encodeURIComponent(slug)}`);
  },

  // ─── Search & Discovery ──────────────────────────────────────────────────────

  search(params: KolSearchParams = {}): Promise<PageResponse<KolSummaryResponse>> {
    const normalized: KolSearchParams = {
      ...params,
      ...(params.platforms && { platforms: params.platforms.map(normalizePlatform) }),
    };
    const query = api.buildQuery(normalized as Record<string, unknown>);
    return api.get(`/kols/search${query}`);
  },

  getFeatured(limit = 10): Promise<KolSummaryResponse[]> {
    return api.get(`/kols/featured?limit=${limit}`);
  },

  // ─── Channels ────────────────────────────────────────────────────────────────

  getChannels(): Promise<KolSocialChannelResponse[]> {
    return api.get('/kols/me/channels');
  },

  addChannel(data: CreateChannelRequest): Promise<KolSocialChannelResponse> {
    return api.post('/kols/me/channels', data);
  },

  deleteChannel(id: number): Promise<void> {
    return api.delete(`/kols/me/channels/${id}`);
  },

  // ─── Pricing Packages ────────────────────────────────────────────────────────

  getPackages(): Promise<KolPricingPackageResponse[]> {
    return api.get('/kols/me/packages');
  },

  addPackage(data: CreatePackageRequest): Promise<KolPricingPackageResponse> {
    return api.post('/kols/me/packages', data);
  },

  deletePackage(id: number): Promise<void> {
    return api.delete(`/kols/me/packages/${id}`);
  },

  // ─── Portfolio ───────────────────────────────────────────────────────────────

  getPortfolio(): Promise<KolPortfolioItemResponse[]> {
    return api.get('/kols/me/portfolio');
  },

  addPortfolioItem(data: CreatePortfolioItemRequest): Promise<KolPortfolioItemResponse> {
    return api.post('/kols/me/portfolio', data);
  },

  deletePortfolioItem(id: number): Promise<void> {
    return api.delete(`/kols/me/portfolio/${id}`);
  },
};
