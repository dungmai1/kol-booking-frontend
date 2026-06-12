import { api } from './client';
import type {
  AdminUserResponse,
  AdminStatsOverview,
  AdminBookingStats,
  AdminTopKol,
  AdminRevenueStats,
  AdminCommissionSummary,
  AdminRejectRequest,
  AdminResolveDisputeRequest,
  KolProfileResponse,
  BrandProfileResponse,
  BookingResponse,
  CategoryResponse,
  CreateCategoryRequest,
  PageResponse,
} from './types';

// ─── Stats response adapters ───────────────────────────────────────────────────
// The backend returns user counts keyed by role plus `platformRevenue`/`activeBookings`
// (see AdminStatsService.overview). Map that raw shape onto the flat `AdminStatsOverview`
// the dashboard consumes, so the page component needs no knowledge of the wire format.

type Role = 'SYSTEM' | 'KOL' | 'ADMIN' | 'BRAND';

interface AdminStatsOverviewRaw {
  users?: Partial<Record<Role, number>>;
  totalBookings?: number | string;
  totalGmv?: number | string;
  platformRevenue?: number | string;
  activeBookings?: number | string;
}

const num = (v: unknown): number => Number(v ?? 0);

function mapStatsOverview(raw: AdminStatsOverviewRaw): AdminStatsOverview {
  const u = raw.users ?? {};
  // "Total users" = real accounts (excludes the synthetic SYSTEM platform-wallet user).
  return {
    totalUsers: num(u.KOL) + num(u.BRAND) + num(u.ADMIN),
    totalKols: num(u.KOL),
    totalBrands: num(u.BRAND),
    totalBookings: num(raw.totalBookings),
    totalRevenue: num(raw.platformRevenue),
    activeBookings: num(raw.activeBookings),
  };
}

interface AdminTopKolRaw {
  kolProfileId?: number | string;
  revenue?: number | string;
  bookings?: number | string;
  displayName?: string | null;
  avgRating?: number | string | null;
}

function mapTopKol(r: AdminTopKolRaw): AdminTopKol {
  return {
    id: num(r.kolProfileId),
    displayName: r.displayName ?? '',
    earnings: num(r.revenue),
    bookingCount: num(r.bookings),
    avgRating: num(r.avgRating),
  };
}

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
    return api.get<AdminStatsOverviewRaw>(`/admin/stats/overview${q}`).then(mapStatsOverview);
  },

  getBookingStats(params: { from?: string; to?: string } = {}): Promise<AdminBookingStats[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/bookings${q}`);
  },

  getTopKols(params: { from?: string; to?: string; limit?: number } = {}): Promise<AdminTopKol[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api
      .get<AdminTopKolRaw[]>(`/admin/stats/top-kols${q}`)
      .then((rows) => (rows ?? []).map(mapTopKol));
  },

  getRevenueStats(params: { from?: string; to?: string } = {}): Promise<AdminRevenueStats[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/revenue${q}`);
  },

  /** Platform commission overview: current rate, accumulated fees, platform wallet. */
  getCommissionSummary(): Promise<AdminCommissionSummary> {
    return api.get('/admin/stats/commission');
  },
};
