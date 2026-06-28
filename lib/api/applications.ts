import { api } from './client';
import type {
  ProductApplicationResponse,
  ApplicationMessageResponse,
  RejectApplicationRequest,
  PageResponse,
} from './types';

/**
 * Single-application lifecycle actions, mapped 1:1 to `ProductApplicationController`
 * (`/api/v1/applications`). Creating an application is on `productsApi.apply`.
 */
export const applicationsApi = {
  // ─── Common ──────────────────────────────────────────────────────────────────

  getById(id: number): Promise<ProductApplicationResponse> {
    return api.get(`/applications/${id}`);
  },

  // ─── KOL ─────────────────────────────────────────────────────────────────────

  listMine(page = 0, size = 20): Promise<PageResponse<ProductApplicationResponse>> {
    return api.get(`/applications/mine?page=${page}&size=${size}`);
  },

  withdraw(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/withdraw`);
  },

  // ─── Brand ───────────────────────────────────────────────────────────────────

  /** Accepts the applicant → backend creates a PENDING booking and links it back. */
  accept(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/accept`);
  },

  reject(id: number, data?: RejectApplicationRequest): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/reject`, data);
  },

  // ─── Price negotiation ───────────────────────────────────────────────────────

  /** Brand sends a counter-offer price to a KOL who proposed a price. */
  counterOffer(id: number, counterPrice: number, negotiationNote?: string): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/counter-offer`, { counterPrice, negotiationNote: negotiationNote || undefined });
  },

  /** KOL accepts the brand's counter-offer → triggers booking creation. */
  acceptCounter(id: number): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/accept-counter`);
  },

  /** KOL rejects the brand's counter-offer → application reverts to PENDING. */
  rejectCounter(id: number, replyMessage?: string): Promise<ProductApplicationResponse> {
    return api.post(`/applications/${id}/reject-counter`, replyMessage ? { replyMessage } : undefined);
  },

  // ─── Negotiation chat ────────────────────────────────────────────────────────

  /** Paginated message history for an application's negotiation chat (newest first). */
  listMessages(id: number, page = 0, size = 50): Promise<PageResponse<ApplicationMessageResponse>> {
    return api.get(`/applications/${id}/messages?page=${page}&size=${size}`);
  },

  /**
   * Send a message in the negotiation chat.
   * Content is passed as a query param because the BE uses @RequestParam (not @RequestBody).
   */
  sendMessage(id: number, content: string): Promise<ApplicationMessageResponse> {
    const qs = new URLSearchParams({ content });
    return api.post(`/applications/${id}/messages?${qs.toString()}`);
  },
};
