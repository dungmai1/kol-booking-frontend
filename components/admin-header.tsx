'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_NAV } from '@/lib/admin-nav';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="bg-canvas border-b border-hairline sticky top-0 z-50">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-ink text-on-dark">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight hidden sm:inline">
              <span className="text-pin-red">KOL Hub</span>{' '}
              <span className="text-ink">Admin</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <p className="text-xs text-mute truncate hidden md:block max-w-[220px]">{user?.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-ink hover:bg-surface-card transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        <nav
          className="flex items-center gap-1 overflow-x-auto pb-px -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Quản trị"
        >
          {ADMIN_NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                  active ? 'text-pin-red' : 'text-ink hover:text-pin-red'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-pin-red rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
