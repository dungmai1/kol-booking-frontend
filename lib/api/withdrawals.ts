import { api } from './client';
import type {
  WithdrawResponse,
  CreateWithdrawRequest,
  PageResponse,
  AdminRejectRequest,
} from './types';

export const withdrawalsApi = {
  // KOL
  create(data: CreateWithdrawRequest): Promise<WithdrawResponse> {
    return api.post('/withdraws', data);
  },

  getMyWithdrawals(page = 0, size = 20): Promise<PageResponse<WithdrawResponse>> {
    return api.get(`/withdraws/me?page=${page}&size=${size}`);
  },

  // Admin
  adminList(status?: string, page = 0, size = 20): Promise<PageResponse<WithdrawResponse>> {
    const q = api.buildQuery({ status, page, size });
    return api.get(`/withdraws/admin${q}`);
  },

  adminApprove(id: number): Promise<WithdrawResponse> {
    return api.post(`/withdraws/admin/${id}/approve`);
  },

  adminPaid(id: number): Promise<WithdrawResponse> {
    return api.post(`/withdraws/admin/${id}/paid`);
  },

  adminReject(id: number, data: AdminRejectRequest): Promise<WithdrawResponse> {
    return api.post(`/withdraws/admin/${id}/reject`, data);
  },
};
