import { api } from './client';
import type {
  BrandProfileResponse,
  BrandPublicResponse,
  KolSummaryResponse,
  PageResponse,
  ProductResponse,
  UpdateBrandProfileRequest,
} from './types';

// ─── Analytics types ──────────────────────────────────────────────────────────
export interface BrandAnalyticsOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalSpend: number;
  avgBudget: number;
  pendingEscrow: number;
  campaignsByStatus: Record<string, number>;
}

export interface BrandSpendingPoint {
  month: string;
  spend: number;
  campaigns: number;
}

export const brandApi = {
  getMyProfile(): Promise<BrandProfileResponse> {
    return api.get('/brands/me');
  },

  getPublicProfile(id: number): Promise<BrandPublicResponse> {
    return api.get(`/brands/${id}`);
  },

  getPublicProducts(id: number, page = 0, size = 12): Promise<PageResponse<ProductResponse>> {
    return api.get(`/brands/${id}/products?page=${page}&size=${size}`);
  },

  updateMyProfile(data: UpdateBrandProfileRequest): Promise<BrandProfileResponse> {
    return api.put('/brands/me', data);
  },

  submitProfile(): Promise<BrandProfileResponse> {
    return api.post('/brands/me/submit');
  },

  // ─── Favorites ───────────────────────────────────────────────────────────────

  addFavorite(kolId: number): Promise<void> {
    return api.post(`/brands/me/favorites/${kolId}`);
  },

  removeFavorite(kolId: number): Promise<void> {
    return api.delete(`/brands/me/favorites/${kolId}`);
  },

  getFavorites(page = 0, size = 20): Promise<PageResponse<KolSummaryResponse>> {
    return api.get(`/brands/me/favorites?page=${page}&size=${size}`);
  },

  // ─── Analytics ───────────────────────────────────────────────────────────────

  getAnalyticsOverview(): Promise<BrandAnalyticsOverview> {
    return api.get('/brands/me/analytics/overview');
  },

  getSpendingChart(months = 12): Promise<BrandSpendingPoint[]> {
    return api.get(`/brands/me/analytics/spending?months=${months}`);
  },

  getCampaignBreakdown(): Promise<Record<string, number>> {
    return api.get('/brands/me/analytics/campaigns');
  },
};
