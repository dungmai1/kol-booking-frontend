import { api } from './client';
import type {
  BrandProfileResponse,
  BrandPublicResponse,
  KolSummaryResponse,
  PageResponse,
  ProductResponse,
  UpdateBrandProfileRequest,
} from './types';

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
};
