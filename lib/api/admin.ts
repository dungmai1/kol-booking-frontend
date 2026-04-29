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

  getUsers(params: { q?: string; role?: string; page?: number; size?: number } = {}): Promise<PageResponse<AdminUserResponse>> {
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

  getOverview(): Promise<AdminStatsOverview> {
    return api.get('/admin/stats/overview');
  },

  getBookingStats(): Promise<AdminBookingStats[]> {
    return api.get('/admin/stats/bookings');
  },

  getTopKols(): Promise<AdminTopKol[]> {
    return api.get('/admin/stats/top-kols');
  },

  getRevenueStats(): Promise<AdminRevenueStats[]> {
    return api.get('/admin/stats/revenue');
  },
};
