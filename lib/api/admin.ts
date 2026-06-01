import { api } from './client';
import type {
  AdminUserResponse,
  AdminStatsOverview,
  AdminBookingStats,
  AdminTopKol,
  AdminRevenueStats,
  AdminRejectRequest,
  AdminResolveDisputeRequest,
  KolProfileResponse,
  BrandProfileResponse,
  BookingResponse,
  CategoryResponse,
  CreateCategoryRequest,
  PageResponse,
} from './types';

export const adminApi = {
  // ─── Users ───────────────────────────────────────────────────────────────────

  getUsers(
    params: {
      search?: string;
      role?: string;
      status?: string;
      page?: number;
      size?: number;
    } = {},
  ): Promise<PageResponse<AdminUserResponse>> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/users${q}`);
  },

  banUser(id: number): Promise<void> {
    return api.post(`/admin/users/${id}/ban`);
  },

  unbanUser(id: number): Promise<void> {
    return api.post(`/admin/users/${id}/unban`);
  },

  // ─── KOL Approval ────────────────────────────────────────────────────────────

  getPendingKols(params: { status?: string; page?: number; size?: number } = {}): Promise<PageResponse<KolProfileResponse>> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/kols${q}`);
  },

  approveKol(id: number): Promise<void> {
    return api.post(`/admin/kols/${id}/approve`);
  },

  rejectKol(id: number, data: AdminRejectRequest): Promise<void> {
    return api.post(`/admin/kols/${id}/reject`, data);
  },

  // ─── Brand Approval ───────────────────────────────────────────────────────────

  getPendingBrands(params: { status?: string; page?: number; size?: number } = {}): Promise<PageResponse<BrandProfileResponse>> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/brands${q}`);
  },

  approveBrand(id: number): Promise<void> {
    return api.post(`/admin/brands/${id}/approve`);
  },

  rejectBrand(id: number, data: AdminRejectRequest): Promise<void> {
    return api.post(`/admin/brands/${id}/reject`, data);
  },

  // ─── Bookings ────────────────────────────────────────────────────────────────

  getBookings(params: { status?: string; page?: number; size?: number } = {}): Promise<PageResponse<BookingResponse>> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/bookings${q}`);
  },

  resolveDispute(id: number, data: AdminResolveDisputeRequest): Promise<void> {
    return api.post(`/admin/bookings/${id}/resolve-dispute`, data);
  },

  // ─── Categories ──────────────────────────────────────────────────────────────

  createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    return api.post('/admin/categories', data);
  },

  updateCategory(id: number, data: CreateCategoryRequest): Promise<CategoryResponse> {
    return api.put(`/admin/categories/${id}`, data);
  },

  deleteCategory(id: number): Promise<void> {
    return api.delete(`/admin/categories/${id}`);
  },

  // ─── Stats ───────────────────────────────────────────────────────────────────

  getStatsOverview(params: { from?: string; to?: string } = {}): Promise<AdminStatsOverview> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/overview${q}`);
  },

  getBookingStats(params: { from?: string; to?: string } = {}): Promise<AdminBookingStats[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/bookings${q}`);
  },

  getTopKols(params: { from?: string; to?: string; limit?: number } = {}): Promise<AdminTopKol[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/top-kols${q}`);
  },

  getRevenueStats(params: { from?: string; to?: string } = {}): Promise<AdminRevenueStats[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/revenue${q}`);
  },
};
