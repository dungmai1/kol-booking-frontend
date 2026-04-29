import { api } from './client';
import type { ReviewResponse, CreateReviewRequest, PageResponse } from './types';

export const reviewsApi = {
  create(bookingId: number, data: CreateReviewRequest): Promise<ReviewResponse> {
    return api.post(`/bookings/${bookingId}/reviews`, data);
  },

  update(reviewId: number, data: CreateReviewRequest): Promise<ReviewResponse> {
    return api.put(`/reviews/${reviewId}`, data);
  },

  getByUser(userId: number, page = 0, size = 20): Promise<PageResponse<ReviewResponse>> {
    return api.get(`/users/${userId}/reviews?page=${page}&size=${size}`);
  },
};
