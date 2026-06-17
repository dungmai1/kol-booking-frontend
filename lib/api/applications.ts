import { api } from './client';
import type {
  ProductApplicationResponse,
  RejectApplicationRequest,
  PageResponse,
} from './types';

/**
 * Single-application lifecycle actions, mapped 1:1 to `ProductApplicationController`
 * (`/api/v1/applications`). Creating an application is on `productsApi.apply`.
 */
export const applicationsApi = {
  // ─── KOL ─────────────────────────────────────────────────────────────────────

  listMine(page = 0, size = 20): Promise<PageResponse<ProductApplicationResponse>> {
    return api.get(`/applications/mine?page=${page}&size=${size}`);
  },

  withdraw(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/withdraw`);
  },

  // ─── Brand ───────────────────────────────────────────────────────────────────

  shortlist(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/shortlist`);
  },

  /** Accepts the applicant → backend creates a PENDING booking and links it back. */
  accept(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/accept`);
  },

  reject(id: number, data?: RejectApplicationRequest): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/reject`, data);
  },

  // ─── Price negotiation ───────────────────────────────────────────────────────

  /** Brand sends a counter-offer price to a KOL who proposed a price. */
  counterOffer(id: number, counterPrice: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/counter-offer`, { counterPrice });
  },

  /** KOL accepts the brand's counter-offer → triggers booking creation. */
  acceptCounter(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/accept-counter`);
  },

  /** KOL rejects the brand's counter-offer → application reverts to PENDING. */
  rejectCounter(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/reject-counter`);
  },
};
