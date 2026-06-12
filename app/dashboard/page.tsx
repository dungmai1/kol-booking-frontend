'use client';

import { Header } from '@/components/header';
import { BarChart3, BookOpen, Star, DollarSign, Loader2, ArrowRight, Megaphone, ClipboardList, Compass, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { bookingsApi } from '@/lib/api/bookings';
import { walletApi } from '@/lib/api/wallet';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingResponse, ReviewResponse, WalletResponse } from '@/lib/api/types';

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  ACCEPTED: 'Đã chấp nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã bàn giao',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Tranh chấp',
  CANCELLED_BY_ADMIN: 'Admin hủy',
};

function statusPill(status: string): string {
  if (status === 'COMPLETED') return 'text-on-dark';
  if (status === 'PENDING') return 'bg-surface-card text-ink';
  if (status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'DELIVERED') return 'bg-ink text-on-dark';
  return 'bg-pin-red text-on-dark';
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const role = user.role;
    Promise.allSettled([
      role === 'KOL' ? bookingsApi.getIncoming(0, 5) : bookingsApi.getMyBookings(0, 5),
      walletApi.getMyWallet(),
      reviewsApi.getByUser(user.userId, 0, 3),
    ]).then(([bRes, wRes, rRes]) => {
      if (bRes.status === 'fulfilled') setBookings(bRes.value.content);
      if (wRes.status === 'fulfilled') setWallet(wRes.value);
      if (rRes.status === 'fulfilled') setReviews(rRes.value.content);
    }).finally(() => setIsLoading(false));
  }, [user]);

  const activeCount = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').length;
  const totalBudget = bookings.reduce((s, b) => s + b.budget, 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-6">
          <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">
            Bảng điều khiển
          </h1>
          <p className="text-mute mt-2">Chào mừng trở lại — đây là tổng quan hoạt động của bạn.</p>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-16">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats — flat cream tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatTile icon={<BookOpen className="w-5 h-5" />} label="Tổng đơn đặt" value={bookings.length.toString()} sub={`${activeCount} đang hoạt động`} />
                <StatTile icon={<DollarSign className="w-5 h-5" />} label="Ví của bạn" value={wallet ? vnd.format(wallet.balanceAvailable) : '—'} sub={wallet ? `Giữ: ${vnd.format(wallet.balanceHeld)}` : 'Chưa có dữ liệu'} />
                <StatTile icon={<BarChart3 className="w-5 h-5" />} label="Tổng ngân sách" value={vnd.format(totalBudget)} sub="Toàn bộ chiến dịch" />
                <StatTile icon={<Star className="w-5 h-5" />} label="Đánh giá trung bình" value={avgRating ? `${avgRating}★` : '—'} sub={`Từ ${reviews.length} nhận xét`} />
              </div>

              {/* Role-aware quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {user?.role === 'BRAND' ? (
                  <>
                    <QuickAction href="/products/new" icon={<Megaphone className="w-5 h-5" />} title="Đăng sản phẩm" desc="Tạo tin tuyển KOL mới" primary />
                    <QuickAction href="/products/manage" icon={<ClipboardList className="w-5 h-5" />} title="Tin đăng của tôi" desc="Quản lý & duyệt ứng viên" />
                    <QuickAction href="/discover" icon={<Compass className="w-5 h-5" />} title="Khám phá KOL" desc="Tìm nhà sáng tạo phù hợp" />
                    <QuickAction href="/bookings" icon={<BookOpen className="w-5 h-5" />} title="Đơn đặt" desc="Theo dõi chiến dịch" />
                  </>
                ) : user?.role === 'KOL' ? (
                  <>
                    <QuickAction href="/products" icon={<Compass className="w-5 h-5" />} title="Khám phá chiến dịch" desc="Tìm tin đăng để ứng tuyển" primary />
                    <QuickAction href="/applications/mine" icon={<ClipboardList className="w-5 h-5" />} title="Ứng tuyển của tôi" desc="Theo dõi trạng thái hồ sơ" />
                    <QuickAction href="/kol-dashboard/wallet" icon={<Wallet className="w-5 h-5" />} title="Ví của tôi" desc="Số dư & rút tiền" />
                    <QuickAction href="/kol-dashboard/me" icon={<Star className="w-5 h-5" />} title="Hồ sơ KOL" desc="Cập nhật trang cá nhân" />
                  </>
                ) : null}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent bookings */}
                <div className="lg:col-span-2">
                  <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-hairline-soft">
                      <h2 className="font-display font-bold text-ink text-[18px]">Đơn đặt gần đây</h2>
                      <Link href="/bookings" className="text-sm font-bold text-ink-soft hover:text-pin-red inline-flex items-center gap-1">
                        Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="p-12 text-center text-mute">Chưa có đơn đặt nào</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-surface-card">
                            <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Chiến dịch</th>
                            <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Ngân sách</th>
                            <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map(b => (
                            <tr key={b.id} className="border-t border-hairline-soft hover:bg-surface-soft transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-ink">{b.campaignTitle}</td>
                              <td className="px-6 py-4 text-sm text-ink">{vnd.format(b.budget)}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusPill(b.status)}`} style={b.status === 'COMPLETED' ? { background: 'var(--success-deep)' } : undefined}>
                                  {statusLabel[b.status] ?? b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Recent reviews */}
                <div>
                  <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-hairline-soft">
                      <h2 className="font-display font-bold text-ink text-[18px]">Nhận xét gần đây</h2>
                      <Link href="/reviews" className="text-sm font-bold text-ink-soft hover:text-pin-red">→</Link>
                    </div>
                    {reviews.length === 0 ? (
                      <div className="p-8 text-center text-mute text-sm">Chưa có nhận xét nào</div>
                    ) : (
                      <ul>
                        {reviews.map(review => (
                          <li key={review.id} className="p-5 border-t border-hairline-soft first:border-t-0">
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-ink text-ink' : 'text-stone'}`} />
                              ))}
                            </div>
                            <p className="text-sm text-body line-clamp-2">{review.comment}</p>
                            <p className="text-xs text-mute mt-2">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA — dark hero strip */}
              <div className="mt-10 rounded-md bg-surface-dark text-on-dark p-8 lg:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8">
                  <h2 className="font-display font-bold text-on-dark text-[24px] md:text-[28px] tracking-[-0.6px] mb-2">
                    Sẵn sàng khám phá thêm KOL?
                  </h2>
                  <p className="text-stone text-sm md:text-base">
                    Duyệt qua mạng lưới các nhà sáng tạo đã xác minh để tìm đối tác phù hợp.
                  </p>
                </div>
                <div className="md:col-span-4 flex md:justify-end gap-3 flex-wrap">
                  <Link href="/discover" className="btn-pin-primary !rounded-full">Khám phá KOL</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-md border p-5 transition-colors ${
        primary
          ? 'bg-ink text-on-dark border-ink hover:bg-charcoal'
          : 'bg-canvas border-hairline hover:border-ink'
      }`}
    >
      <span
        className={`grid place-items-center w-9 h-9 rounded-full mb-3 ${
          primary ? 'bg-canvas/15 text-on-dark' : 'bg-surface-card text-ink'
        }`}
      >
        {icon}
      </span>
      <p className={`font-bold text-[15px] ${primary ? 'text-on-dark' : 'text-ink'}`}>{title}</p>
      <p className={`text-xs mt-1 ${primary ? 'text-stone' : 'text-mute'}`}>{desc}</p>
    </Link>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-canvas rounded-md border border-hairline p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-mute uppercase tracking-wider">{label}</span>
        <span className="grid place-items-center w-8 h-8 rounded-full bg-surface-card text-ink">{icon}</span>
      </div>
      <p className="font-display font-bold text-ink text-[24px] tracking-tight truncate">{value}</p>
      <p className="text-xs text-mute mt-2 truncate">{sub}</p>
    </div>
  );
}
