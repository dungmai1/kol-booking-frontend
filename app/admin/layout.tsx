'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Building2, Loader2, LayoutDashboard, FolderTree, Users, Coins, Banknote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/AuthContext';

const NAV: Array<{ href: string; label: string; icon: LucideIcon; exact?: boolean }> = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/kols/review', label: 'Duyệt KOL', icon: UserCheck },
  { href: '/admin/brands/review', label: 'Duyệt Brand', icon: Building2 },
  { href: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { href: '/admin/commission', label: 'Hoa hồng', icon: Coins },
  { href: '/admin/withdrawals', label: 'Rút tiền', icon: Banknote },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
      return;
    }
    if (user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft grid place-items-center">
          <div className="flex items-center gap-3 text-mute">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Đang kiểm tra quyền truy cập…</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-6 pb-16">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-ink text-on-dark">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight leading-none">
                Khu vực quản trị
              </h1>
              <p className="text-xs text-mute mt-1">
                Đăng nhập với quyền ADMIN — {user.email}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 mb-6 border-b border-hairline">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                    active
                      ? 'text-pin-red'
                      : 'text-ink hover:text-pin-red'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-pin-red rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </main>
    </>
  );
}
