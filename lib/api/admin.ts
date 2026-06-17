import { api } from './client';
import type {
  AdminUserResponse,
  AdminStatsOverview,
  AdminBookingStats,
  AdminTopKol,
  AdminRevenueStats,
  AdminEscrowMetrics,
  AdminCommissionSummary,
  AdminCommissionTransaction,
  AdminRejectRequest,
  AdminResolveDisputeRequest,
  KolProfileResponse,
  BrandProfileResponse,
  BookingResponse,
  CategoryResponse,
  CreateCategoryRequest,
  PageResponse,
  StatsGranularity,
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
  disputeCount?: number;
  pendingKolApprovals?: number;
  pendingBrandApprovals?: number;
  previousPeriod?: {
    users?: Partial<Record<Role, number>>;
    totalBookings?: number | string;
    platformRevenue?: number | string;
  };
}

const num = (v: unknown): number => Number(v ?? 0);

function mapStatsOverview(raw: AdminStatsOverviewRaw): AdminStatsOverview {
  const u = raw.users ?? {};
  const prev = raw.previousPeriod;
  const pu = prev?.users ?? {};
  return {
    totalUsers: num(u.KOL) + num(u.BRAND) + num(u.ADMIN),
    totalKols: num(u.KOL),
    totalBrands: num(u.BRAND),
    totalBookings: num(raw.totalBookings),
    totalRevenue: num(raw.platformRevenue),
    activeBookings: num(raw.activeBookings),
    disputeCount: num(raw.disputeCount),
    pendingKolApprovals: num(raw.pendingKolApprovals),
    pendingBrandApprovals: num(raw.pendingBrandApprovals),
    previousMonth: prev
      ? {
          totalUsers: num(pu.KOL) + num(pu.BRAND) + num(pu.ADMIN),
          totalKols: num(pu.KOL),
          totalBrands: num(pu.BRAND),
          totalBookings: num(prev.totalBookings),
          totalRevenue: num(prev.platformRevenue),
        }
      : undefined,
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
    kolNet: num(r.revenue),
    bookingCount: num(r.bookings),
    avgRating: num(r.avgRating),
  };
}

export const adminApi = {
  // ─── Users ───────────────────────────────────────────────────────────────────

  getUsers(
    params: {
      q?: string;
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

  deleteUser(id: number): Promise<void> {
    return api.delete(`/admin/users/${id}`);
  },

  createUser(data: { email: string; password: string; role: 'KOL' | 'BRAND' }): Promise<AdminUserResponse> {
    return api.post('/admin/users', data);
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

  getKol(id: number): Promise<KolProfileResponse> {
    return api.get(`/admin/kols/${id}`);
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

  getBookingStats(params: { from?: string; to?: string; granularity?: StatsGranularity } = {}): Promise<AdminBookingStats[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get<Record<string, unknown>[]>(`/admin/stats/bookings${q}`).then((rows) =>
      (rows ?? []).map((r) => ({
        period: String(r.period ?? r.month ?? r.day ?? r.year ?? ''),
        count: Number(r.count ?? 0),
        total: Number(r.total ?? 0),
      })),
    );
  },

  getTopKols(params: { from?: string; to?: string; limit?: number } = {}): Promise<AdminTopKol[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api
      .get<AdminTopKolRaw[]>(`/admin/stats/top-kols${q}`)
      .then((rows) => (rows ?? []).map(mapTopKol));
  },

  getRevenueStats(params: { from?: string; to?: string; granularity?: StatsGranularity } = {}): Promise<AdminRevenueStats[]> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get<Record<string, unknown>[]>(`/admin/stats/revenue${q}`).then((rows) =>
      (rows ?? []).map((r) => ({
        period: String(r.period ?? r.month ?? r.day ?? r.year ?? ''),
        fee: Number(r.fee ?? r.platformFee ?? r.revenue ?? 0),
      })),
    );
  },

  getEscrowMetrics(params: { from?: string; to?: string } = {}): Promise<AdminEscrowMetrics> {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get<Record<string, unknown>>(`/admin/stats/escrow-metrics${q}`).then((raw) => ({
      totalEscrowHeld: Number(raw.totalEscrowHeld ?? 0),
      bookingsPendingApproval: Number(raw.bookingsPendingApproval ?? 0),
      refundRate: Number(raw.refundRate ?? 0),
      completedBookings: Number(raw.completedBookings ?? 0),
      rejectedDeliveries: Number(raw.rejectedDeliveries ?? 0),
      totalRefunded: Number(raw.totalRefunded ?? 0),
    }));
  },

  /** Platform commission overview: current rate, accumulated fees, platform wallet. */
  getCommissionSummary(): Promise<AdminCommissionSummary> {
    return api.get('/admin/stats/commission');
  },

  /** Paginated FEE ledger entries with linked booking details. */
  getCommissionTransactions(params: { page?: number; size?: number } = {}): Promise<
    PageResponse<AdminCommissionTransaction>
  > {
    const q = api.buildQuery(params as Record<string, unknown>);
    return api.get(`/admin/stats/commission/transactions${q}`);
  },
};
