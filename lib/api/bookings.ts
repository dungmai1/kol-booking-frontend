import { api } from './client';
import type {
  BookingResponse,
  BookingMessageResponse,
  CreateBookingRequest,
  SendMessageRequest,
  SubmitDeliverableRequest,
  PageResponse,
} from './types';

export const bookingsApi = {
  // ─── CRUD ────────────────────────────────────────────────────────────────────

  create(data: CreateBookingRequest): Promise<BookingResponse> {
    return api.post('/bookings', data);
  },

  getById(id: number): Promise<BookingResponse> {
    return api.get(`/bookings/${id}`);
  },

  /** BRAND: list bookings created by the logged-in brand */
  getMyBookings(page = 0, size = 20): Promise<PageResponse<BookingResponse>> {
    return api.get(`/bookings/me?page=${page}&size=${size}`);
  },

  /** KOL: list incoming booking requests */
  getIncoming(page = 0, size = 20): Promise<PageResponse<BookingResponse>> {
    return api.get(`/bookings/incoming?page=${page}&size=${size}`);
  },

  // ─── Actions ─────────────────────────────────────────────────────────────────

  cancel(id: number, reason?: string): Promise<void> {
    return api.post(`/bookings/${id}/cancel`, reason ? { reason } : undefined);
  },

  accept(id: number): Promise<BookingResponse> {
    return api.post(`/bookings/${id}/accept`);
  },

  reject(id: number, reason?: string): Promise<BookingResponse> {
    return api.post(`/bookings/${id}/reject`, reason ? { reason } : undefined);
  },

  submitDeliverable(id: number, data: SubmitDeliverableRequest): Promise<BookingResponse> {
    return api.post(`/bookings/${id}/deliverables`, data);
  },

  approveDelivery(id: number): Promise<BookingResponse> {
    return api.post(`/bookings/${id}/approve-delivery`);
  },

  rejectDelivery(id: number, reason?: string): Promise<BookingResponse> {
    return api.post(`/bookings/${id}/reject-delivery`, reason ? { reason } : undefined);
  },

  dispute(id: number, reason?: string): Promise<BookingResponse> {
    return api.post(`/bookings/${id}/dispute`, reason ? { reason } : undefined);
  },

  // ─── Messages ────────────────────────────────────────────────────────────────

  sendMessage(id: number, data: SendMessageRequest): Promise<BookingMessageResponse> {
    return api.post(`/bookings/${id}/messages`, data);
  },

  getMessages(id: number, page = 0, size = 50): Promise<PageResponse<BookingMessageResponse>> {
    return api.get(`/bookings/${id}/messages?page=${page}&size=${size}`);
  },
};
