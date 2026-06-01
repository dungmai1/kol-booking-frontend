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

export type ProfileStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED_BY_ADMIN';

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

export type PaymentOrderStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BOOKING_PAYMENT'
  | 'REFUND'
  | 'PLATFORM_FEE';

export type WithdrawStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export type ReviewDirection = 'TO_KOL' | 'TO_BRAND';

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
  | 'NEW_MESSAGE';

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
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface BookingResponse {
  id: number;
  brandProfileId: number;
  kolProfileId: number;
  campaignTitle: string;
  campaignBrief: string;
  deliverables: string;
  budget: number;
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
  createdAt: string;
  updatedAt: string;
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
  kolUserId: number;
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
  createdAt: string;
}

export interface AdminStatsOverview {
  totalUsers: number;
  totalKols: number;
  totalBrands: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
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
  earnings: number;
  bookingCount: number;
  avgRating: number;
}

export interface AdminRevenueStats {
  month: string;
  platformFee: number;
  totalPayments: number;
}

export interface AdminRejectRequest {
  reason: string;
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
