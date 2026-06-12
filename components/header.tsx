'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, LogOut, User, LayoutDashboard, Settings, Megaphone, ClipboardList } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notification-bell';

/**
 * Pinterest primary-nav: red wordmark left, centered pill search bar,
 * right cluster of ghost links + always-red "Đăng ký" CTA.
 */
export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Defer auth-dependent UI until after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout();
    router.push('/');
  }

  return (
    <header className="bg-canvas border-b border-hairline sticky top-0 z-50">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Brand wordmark — Pinterest red, the only red on chrome aside from the CTA */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="grid place-items-center w-8 h-8 rounded-full bg-pin-red text-on-dark font-extrabold text-base"
            aria-hidden
          >
            K
          </span>
          <span className="font-display font-extrabold text-lg text-pin-red tracking-tight hidden sm:inline">
            KOL Hub
          </span>
        </Link>

        {/* Ghost link cluster (visible on desktop) */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
          <Link href="/discover" className="px-3 py-2 text-ink font-semibold text-[15px] hover:bg-surface-card rounded-full transition-colors">
            Khám phá
          </Link>
          <Link href="/kol-profiles" className="px-3 py-2 text-ink font-semibold text-[15px] hover:bg-surface-card rounded-full transition-colors">
            Hồ sơ KOL
          </Link>
          <Link href="/products" className="px-3 py-2 text-ink font-semibold text-[15px] hover:bg-surface-card rounded-full transition-colors">
            Chiến dịch
          </Link>
        </nav>

        {/* Centered pill search bar */}
        <div className="flex-1 max-w-[640px] mx-auto">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mute pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm ý tưởng, KOL, chiến dịch…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  router.push(v ? `/discover?q=${encodeURIComponent(v)}` : '/discover');
                }
              }}
              className="pin-search h-12"
              aria-label="Tìm kiếm"
            />
          </div>
          {/* Mobile: search collapses to a circular icon button.
              Use Link (not router.push) so Next.js prefetches /discover. */}
          <Link
            href="/discover"
            prefetch
            className="md:hidden grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </Link>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          {!mounted || isLoading ? (
            <div className="flex items-center gap-2" aria-hidden>
              <div className="hidden sm:block w-[88px] h-10 rounded-full bg-surface-card animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-surface-card animate-pulse" />
            </div>
          ) : isAuthenticated ? (
            <>
              {/* Bookings + Dashboard quick links */}
              <Link href="/bookings" className="hidden md:inline-flex px-3 py-2 text-ink font-semibold text-[15px] hover:bg-surface-card rounded-full transition-colors">
                Đơn đặt
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* Avatar + menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="grid place-items-center w-10 h-10 rounded-full bg-ink text-on-dark font-bold text-sm hover:bg-charcoal transition-colors"
                  aria-label="Tài khoản"
                >
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-canvas rounded-[16px] py-2 z-50 border border-hairline shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
                    <div className="px-4 py-3 border-b border-hairline-soft">
                      <p className="text-sm font-bold text-ink truncate">{user?.email}</p>
                      <p className="text-xs text-mute mt-0.5">{user?.role}</p>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-surface-card text-sm font-semibold">
                      <User className="w-4 h-4" /> Hồ sơ
                    </Link>
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-surface-card text-sm font-semibold">
                      <LayoutDashboard className="w-4 h-4" /> Bảng điều khiển
                    </Link>
                    {user?.role === 'BRAND' && (
                      <Link href="/products/manage" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-surface-card text-sm font-semibold">
                        <Megaphone className="w-4 h-4" /> Tin đăng của tôi
                      </Link>
                    )}
                    {user?.role === 'KOL' && (
                      <>
                        <Link href="/applications/mine" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-surface-card text-sm font-semibold">
                          <ClipboardList className="w-4 h-4" /> Ứng tuyển của tôi
                        </Link>
                        <Link href="/kol-dashboard/me" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-surface-card text-sm font-semibold">
                          <Settings className="w-4 h-4" /> Trang quản lý KOL
                        </Link>
                      </>
                    )}
                    <div className="border-t border-hairline-soft mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-surface-card text-sm font-semibold text-left">
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:inline-flex btn-pin-secondary !rounded-full">
                Đăng nhập
              </Link>
              <Link href="/auth/register" className="btn-pin-primary !rounded-full">
                Đăng ký
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden grid place-items-center w-10 h-10 rounded-full text-ink hover:bg-surface-card transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-hairline bg-canvas">
          <nav className="flex flex-col p-3">
            <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-ink font-semibold rounded-full hover:bg-surface-card">
              Khám phá
            </Link>
            <Link href="/kol-profiles" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-ink font-semibold rounded-full hover:bg-surface-card">
              Hồ sơ KOL
            </Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-ink font-semibold rounded-full hover:bg-surface-card">
              Chiến dịch
            </Link>
            {!mounted || isLoading ? null : isAuthenticated ? (
              <>
                <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-ink font-semibold rounded-full hover:bg-surface-card">
                  Đơn đặt
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-ink font-semibold rounded-full hover:bg-surface-card">
                  Bảng điều khiển
                </Link>
                <button onClick={handleLogout} className="text-left px-4 py-3 text-ink font-semibold rounded-full hover:bg-surface-card flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-2 mt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 btn-pin-secondary !rounded-full">
                  Đăng nhập
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 btn-pin-primary !rounded-full">
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
