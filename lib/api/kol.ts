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
} from './types';

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
    const query = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/kols/search${query}`);
  },

  getFeatured(limit = 10): Promise<KolSummaryResponse[]> {
    return api.get(`/kols/featured?limit=${limit}`);
  },

  // ─── Channels ────────────────────────────────────────────────────────────────

  addChannel(data: CreateChannelRequest): Promise<KolSocialChannelResponse> {
    return api.post('/kols/me/channels', data);
  },

  deleteChannel(id: number): Promise<void> {
    return api.delete(`/kols/me/channels/${id}`);
  },

  // ─── Pricing Packages ────────────────────────────────────────────────────────

  addPackage(data: CreatePackageRequest): Promise<KolPricingPackageResponse> {
    return api.post('/kols/me/packages', data);
  },

  deletePackage(id: number): Promise<void> {
    return api.delete(`/kols/me/packages/${id}`);
  },

  // ─── Portfolio ───────────────────────────────────────────────────────────────

  addPortfolioItem(data: CreatePortfolioItemRequest): Promise<KolPortfolioItemResponse> {
    return api.post('/kols/me/portfolio', data);
  },

  deletePortfolioItem(id: number): Promise<void> {
    return api.delete(`/kols/me/portfolio/${id}`);
  },
};
