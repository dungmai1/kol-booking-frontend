'use client';

import Link from 'next/link';
import { Menu, X, Search, LogOut } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
          <Link href="/bookings" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
            Đơn đặt của tôi
          </Link>
          <Link href="/dashboard" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
            Bảng điều khiển
          </Link>
          <Link href="/pricing" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors">
            Bảng giá
          </Link>
        </nav>

        {/* Right side - Search + Auth */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors text-slate-600">
            <Search className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Tìm kiếm</span>
          </button>

          {/* User Menu - KOL Dashboard Link */}
          <Link href="/kol-dashboard/1" className="px-3 py-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-colors hidden sm:inline">
            Trang quản lý
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full hover:shadow-lg transition-shadow"
            />
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Hồ sơ của tôi
                </Link>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Bảng điều khiển
                </Link>
                <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Cài đặt
                </Link>
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col gap-1 p-4">
            <Link href="/discover" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Khám phá KOL
            </Link>
            <Link href="/kol-profiles" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Hồ sơ KOL
            </Link>
            <Link href="/bookings" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Đơn đặt của tôi
            </Link>
            <Link href="/dashboard" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Bảng điều khiển
            </Link>
            <Link href="/pricing" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
              Bảng giá
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
