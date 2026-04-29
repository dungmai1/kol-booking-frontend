'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, LogOut, User, LayoutDashboard, Settings, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/lib/api/notifications';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;
    notificationsApi.getUnreadCount()
      .then((res) => setUnreadCount(res.count))
      .catch(() => {});
  }, [isAuthenticated]);

  // Close user menu on outside click
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
    <header className="bg-white/95 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent hidden sm:inline">KOL Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/discover" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
            Khám phá KOL
          </Link>
          <Link href="/kol-profiles" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
            Hồ sơ KOL
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/bookings" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
                Đơn đặt của tôi
              </Link>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
                Bảng điều khiển
              </Link>
            </>
          )}
          <Link href="/pricing" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
            Bảng giá
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link href="/discover" className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors text-slate-600">
            <Search className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Tìm kiếm</span>
          </Link>

          {isAuthenticated ? (
            <>
              {/* KOL Dashboard link */}
              {user?.role === 'KOL' && (
                <Link href="/kol-dashboard/me" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors hidden sm:inline">
                  Trang quản lý
                </Link>
              )}

              {/* Notifications */}
              <Link href="/notifications" className="relative p-2 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full hover:shadow-lg transition-shadow flex items-center justify-center text-white font-bold text-sm"
                  aria-label="Tài khoản"
                >
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      Hồ sơ của tôi
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Bảng điều khiển
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      Cài đặt
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-slate-700 hover:text-cyan-600 font-medium transition-colors hidden sm:inline"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg text-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col gap-1 p-4">
            <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Khám phá KOL
            </Link>
            <Link href="/kol-profiles" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Hồ sơ KOL
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                  Đơn đặt của tôi
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                  Bảng điều khiển
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                  Đăng nhập
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-cyan-600 font-medium hover:bg-cyan-50 rounded">
                  Đăng ký
                </Link>
              </>
            )}
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Bảng giá
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
