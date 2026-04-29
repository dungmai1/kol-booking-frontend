import { api } from './client';
import type { CheckoutResponse, CheckoutRequest } from './types';

export const paymentsApi = {
  checkout(bookingId: number, data?: CheckoutRequest): Promise<CheckoutResponse> {
    return api.post(`/payments/bookings/${bookingId}/checkout`, data);
  },

  getStatus(bookingId: number): Promise<CheckoutResponse> {
    return api.get(`/payments/bookings/${bookingId}`);
  },
};
