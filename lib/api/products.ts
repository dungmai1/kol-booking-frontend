import { api } from './client';
import type {
  ProductResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductBrowseParams,
  ProductApplicationResponse,
  ProductApplicationCreateRequest,
  ApplicationStatus,
  TopApplicantsBy,
  PageResponse,
} from './types';

/**
 * Brand product postings ("đăng tin") + KOL applications, mapped 1:1 to
 * `ProductController` (`/api/v1/products`). Application lifecycle actions on a
 * single application live in `applicationsApi` (`/api/v1/applications`).
 */
export const productsApi = {
  // ─── Public browse ───────────────────────────────────────────────────────────

  browse(params: ProductBrowseParams = {}): Promise<PageResponse<ProductResponse>> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/products${q}`);
  },

  getById(id: number): Promise<ProductResponse> {
    return api.get(`/products/${id}`);
  },

  // ─── Brand: manage own postings ──────────────────────────────────────────────

  create(data: ProductCreateRequest): Promise<ProductResponse> {
    return api.post('/products', data);
  },

  update(id: number, data: ProductUpdateRequest): Promise<ProductResponse> {
    return api.put(`/products/${id}`, data);
  },

  close(id: number): Promise<ProductResponse> {
    return api.post(`/products/${id}/close`);
  },

  reopen(id: number): Promise<ProductResponse> {
    return api.post(`/products/${id}/reopen`);
  },

  remove(id: number): Promise<void> {
    return api.delete(`/products/${id}`);
  },

  listMine(page = 0, size = 20): Promise<PageResponse<ProductResponse>> {
    return api.get(`/products/mine?page=${page}&size=${size}`);
  },

  // ─── KOL: apply ──────────────────────────────────────────────────────────────

  apply(
    productId: number,
    data?: ProductApplicationCreateRequest,
  ): Promise<ProductApplicationResponse> {
    return api.post(`/products/${productId}/applications`, data);
  },

  // ─── Brand: review applicants for a product ──────────────────────────────────

  listApplicants(
    productId: number,
    params: { status?: ApplicationStatus; page?: number; size?: number } = {},
  ): Promise<PageResponse<ProductApplicationResponse>> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/products/${productId}/applications${q}`);
  },

  topApplicants(
    productId: number,
    by: TopApplicantsBy = 'rating',
    limit = 5,
  ): Promise<ProductApplicationResponse[]> {
    return api.get(`/products/${productId}/applications/top?by=${by}&limit=${limit}`);
  },
};
