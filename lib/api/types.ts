// ─── Common ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errorCode: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'BRAND' | 'KOL';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'BANNED';

/** After submit, backend returns `PENDING_REVIEW` (legacy alias: `SUBMITTED`). */
export type ProfileStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED_BY_ADMIN'
  | 'DELIVERY_REJECTED';

export type Platform = 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK';

export type PricingPackageType =
  | 'POST'
  | 'STORY'
  | 'VIDEO'
  | 'SHOUTOUT'
  | 'LONG_FORM'
  | 'CUSTOM';

export type MediaType = 'IMAGE' | 'VIDEO';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PaymentProvider = 'VNPAY' | 'MOMO' | 'STRIPE' | 'MOCK';

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

/**
 * Wallet ledger entry types — mirrors backend `payment.domain.TransactionType`.
 * DEPOSIT/RELEASE/REFUND credit the wallet; HOLD/WITHDRAW/FEE debit it.
 */
export type TransactionType =
  | 'DEPOSIT'
  | 'HOLD'
  | 'RELEASE'
  | 'WITHDRAW'
  | 'REFUND'
  | 'FEE';

export type ProductStatus = 'OPEN' | 'CLOSED';

export type ApplicationStatus =
  | 'PENDING'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type WithdrawStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export type ReviewDirection = 'BRAND_TO_KOL' | 'KOL_TO_BRAND' | 'TO_KOL' | 'TO_BRAND';

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_IN_PROGRESS'
  | 'DELIVERABLE_SUBMITTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_DISPUTED'
  | 'PAYMENT_SUCCESS'
  | 'REVIEW_RECEIVED'
  | 'WITHDRAW_APPROVED'
  | 'WITHDRAW_REJECTED'
  | 'PROFILE_APPROVED'
  | 'PROFILE_REJECTED'
  | 'NEW_MESSAGE'
  | 'PRODUCT_APPLICATION_RECEIVED'
  | 'APPLICATION_SHORTLISTED'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  userId: number;
  email: string;
  role: Role;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'BRAND' | 'KOL';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MeResponse {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

// ─── KOL Profile ──────────────────────────────────────────────────────────────

export interface KolSocialChannelResponse {
  id: number;
  platform: Platform;
  url: string;
  username: string;
  followerCount: number;
  engagementRate: number;
  verified: boolean;
}

export interface KolPricingPackageResponse {
  id: number;
  type: PricingPackageType;
  platform: Platform;
  price: number;
  description: string;
}

export interface KolPortfolioItemResponse {
  id: number;
  title: string;
  mediaUrl: string;
  mediaType: MediaType;
  campaignName: string;
}

export interface KolProfileResponse {
  id: number;
  userId: number;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  city: string | null;
  country: string | null;
  status: ProfileStatus;
  avgRating: number;
  reviewCount: number;
  rejectReason: string | null;
  categoryIds: number[];
  channels: KolSocialChannelResponse[];
  pricingPackages: KolPricingPackageResponse[];
  portfolio: KolPortfolioItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface KolPublicResponse extends KolProfileResponse {}

export interface KolSummaryResponse {
  id: number;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
  avgRating: number;
  reviewCount: number;
  maxFollowerCount: number;
  minPrice: number;
  platforms?: Platform[];
  categories?: CategoryResponse[];
  isFavorite?: boolean;
}

export interface UpdateKolProfileRequest {
  displayName?: string;
  slug?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  gender?: Gender;
  dateOfBirth?: string;
  city?: string;
  country?: string;
  categoryIds?: number[];
}

export interface CreateChannelRequest {
  platform: Platform;
  url: string;
  username: string;
  followerCount: number;
  engagementRate: number;
  verified: boolean;
}

export interface CreatePackageRequest {
  type: PricingPackageType;
  platform: Platform;
  price: number;
  description: string;
}

export interface CreatePortfolioItemRequest {
  title: string;
  mediaUrl: string;
  mediaType: MediaType;
  campaignName: string;
}

export interface KolSearchParams {
  q?: string;
  categoryIds?: number[];
  platforms?: Platform[];
  minFollower?: number;
  maxFollower?: number;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  country?: string;
  gender?: Gender;
  minRating?: number;
  sort?:
    | 'featured'
    | 'rating'
    | 'price_asc'
    | 'price_desc'
    | 'followers'
    | 'newest';
  page?: number;
  size?: number;
}

// ─── Brand Profile ────────────────────────────────────────────────────────────

export interface BrandProfileResponse {
  id: number;
  userId: number;
  companyName: string;
  taxCode: string | null;
  industry: string | null;
  logoUrl: string | null;
  website: string | null;
  contactName: string | null;
  contactPhone: string | null;
  address: string | null;
  bio: string | null;
  country: string | null;
  status: ProfileStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandProfileRequest {
  companyName?: string;
  taxCode?: string;
  industry?: string;
  logoUrl?: string;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  bio?: string;
  country?: string;
}

/** Public brand profile — excludes private contact/tax fields. */
export interface BrandPublicResponse {
  id: number;
  userId: number;
  companyName: string;
  industry: string | null;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  bio: string | null;
  country: string | null;
  status: ProfileStatus;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface BookingResponse {
  id: number;
  brandProfileId: number;
  /** Denormalized for list/detail display (optional until backend embeds summary). */
  brandCompanyName?: string | null;
  kolProfileId: number;
  /** Denormalized KOL display name (optional until backend embeds summary). */
  kolDisplayName?: string | null;
  campaignTitle: string;
  campaignBrief: string;
  deliverables: string;
  budget: number;
  /** Commission rate snapshotted onto the booking at creation (e.g. 10). Null for legacy bookings. */
  platformFeePercent: number | null;
  /** Absolute platform fee = budget * platformFeePercent%. Null for legacy bookings. */
  platformFeeAmount: number | null;
  /** Net amount the KOL receives = budget − platformFeeAmount. Null for legacy bookings. */
  kolNetAmount: number | null;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  rejectReason: string | null;
  cancelReason: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  kolProfileId: number;
  campaignTitle: string;
  campaignBrief: string;
  deliverables: string;
  budget: number;
  startDate: string;
  endDate: string;
}

export interface BookingMessageResponse {
  id: number;
  bookingId: number;
  senderUserId: number;
  content: string;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  attachmentUrl?: string;
}

export interface SubmitDeliverableRequest {
  deliverableId: number;
  type: PricingPackageType;
  platform: Platform;
  submittedUrl: string;
  note?: string;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewResponse {
  id: number;
  bookingId: number;
  authorId: number;
  targetId: number;
  direction: ReviewDirection;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  authorKolSlug?: string | null;
  authorBrandProfileId?: number | null;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface CheckoutResponse {
  paymentOrderId: number;
  bookingId: number;
  amount: number;
  provider: PaymentProvider;
  status: PaymentOrderStatus;
  paymentUrl: string;
  externalRef: string;
}

export interface CheckoutRequest {
  provider?: PaymentProvider;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletResponse {
  id: number;
  userId: number;
  balanceAvailable: number;
  balanceHeld: number;
  currency: string;
}

export interface WalletTransactionResponse {
  id: number;
  walletId: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  bookingId: number | null;
  externalRef: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export interface WithdrawResponse {
  id: number;
  userId: number;
  requesterRole: 'KOL' | 'BRAND' | 'ADMIN' | null;
  amount: number;
  bankName: string;
  bankAccount: string;
  accountName: string;
  status: WithdrawStatus;
  rejectReason: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface CreateWithdrawRequest {
  amount: number;
  bankName: string;
  bankAccount: string;
  accountName: string;
}

// ─── Products (brand postings) & Applications ─────────────────────────────────

export interface ProductResponse {
  id: number;
  brandProfileId: number;
  brandCompanyName: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  budget: number | null;
  categoryId: number | null;
  categoryName: string | null;
  requiredPlatform: Platform | null;
  minFollowers: number | null;
  slots: number | null;
  status: ProductStatus;
  deadline: string | null;
  applicationCount: number;
  /** True when the current KOL has already applied (only meaningful for KOL viewers). */
  hasApplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  budget?: number;
  categoryId?: number;
  requiredPlatform?: Platform;
  minFollowers?: number;
  slots?: number;
  deadline?: string;
}

/** Partial update — only provided (non-undefined) fields are applied. */
export type ProductUpdateRequest = Partial<ProductCreateRequest>;

export interface ProductBrowseParams {
  q?: string;
  categoryId?: number;
  platform?: Platform;
  brandProfileId?: number;
  minBudget?: number;
  maxBudget?: number;
  page?: number;
  size?: number;
}

/** Application enriched with the KOL's denormalized stats so the brand can rank candidates. */
export interface ProductApplicationResponse {
  id: number;
  productId: number;
  kolProfileId: number;
  kolDisplayName: string | null;
  kolSlug: string | null;
  kolAvatarUrl: string | null;
  kolAvgRating: number | null;
  kolReviewCount: number | null;
  kolMaxFollowerCount: number | null;
  kolMinPrice: number | null;
  message: string | null;
  proposedPrice: number | null;
  status: ApplicationStatus;
  bookingId: number | null;
  rejectReason: string | null;
  createdAt: string;
}

export interface ProductApplicationCreateRequest {
  message?: string;
  proposedPrice?: number;
}

export interface RejectApplicationRequest {
  reason?: string;
}

/** Metric for the brand's "top N applicants" filter. */
export type TopApplicantsBy = 'rating' | 'reviews' | 'followers';

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ReadAllResponse {
  updated: number;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children: CategoryResponse[];
}

// ─── File Upload ──────────────────────────────────────────────────────────────

export interface FileUploadResponse {
  url: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUserResponse {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified?: boolean;
  createdAt: string;
  profileDisplayName?: string | null;
  kolSlug?: string | null;
  brandProfileId?: number | null;
}

export interface AdminStatsOverview {
  totalUsers: number;
  totalKols: number;
  totalBrands: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  disputeCount: number;
  pendingKolApprovals: number;
  pendingBrandApprovals: number;
  previousMonth?: {
    totalUsers?: number;
    totalKols?: number;
    totalBrands?: number;
    totalBookings?: number;
    totalRevenue?: number;
    activeBookings?: number;
  };
}

export interface AdminBookingStats {
  month: string;
  count: number;
  revenue: number;
}

export interface AdminTopKol {
  id: number;
  displayName: string;
  kolNet: number;
  bookingCount: number;
  avgRating: number;
}

/** GET /admin/stats/revenue — monthly platform commission (FE-mapped from `{month, fee}`). */
export interface AdminRevenueStats {
  /** "YYYY-MM" */
  month: string;
  /** Total platform fee collected that month. */
  fee: number;
}

export interface AdminRejectRequest {
  reason: string;
}

/** GET /admin/stats/commission — platform commission overview. */
export interface AdminCommissionSummary {
  /** Current default fee rate as a whole-number percent (e.g. 10). */
  defaultFeePercent: number;
  /** Available balance of the system platform wallet (user_id = 0). */
  platformWalletAvailable: number;
  /** Sum of all FEE ledger entries ever booked. */
  totalCommission: number;
  /** Number of FEE ledger entries. */
  commissionTransactions: number;
}

/** GET /admin/stats/escrow-metrics — financial-risk metrics for admin ops. */
export interface AdminEscrowMetrics {
  /** Total brand funds currently frozen in escrow (current snapshot). */
  totalEscrowHeld: number;
  /** DELIVERED bookings waiting for brand review or auto-complete (current snapshot). */
  bookingsPendingApproval: number;
  /** Refund rate = DELIVERY_REJECTED / (COMPLETED + DELIVERY_REJECTED) in date range (0–1). */
  refundRate: number;
  /** Count of completed bookings in range. */
  completedBookings: number;
  /** Count of delivery-rejected bookings in range. */
  rejectedDeliveries: number;
  /** Sum of all REFUND wallet-transactions in date range. */
  totalRefunded: number;
}

/** GET /admin/stats/commission/transactions — one FEE ledger row with booking context. */
export interface AdminCommissionTransaction {
  id: number;
  amount: number;
  recordedAt: string;
  bookingId: number | null;
  campaignTitle: string | null;
  bookingBudget: number | null;
  feePercent: number | null;
  brandCompanyName: string | null;
  kolDisplayName: string | null;
  bookingStatus: string | null;
  note: string | null;
}

export interface AdminResolveDisputeRequest {
  resolution: 'REFUND_TO_BRAND' | 'PAY_KOL' | 'PARTIAL_REFUND';
  amount: number;
  note?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parentId?: number | null;
}
