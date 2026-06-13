'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin-header';
import { useAuth } from '@/contexts/AuthContext';

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
      <main className="min-h-screen bg-surface-soft grid place-items-center">
        <div className="flex items-center gap-3 text-mute">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Đang kiểm tra quyền truy cập…</span>
        </div>
      </main>
    );
  }

  return (
    <>
      <AdminHeader />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-6 pb-16">{children}</div>
      </main>
    </>
  );
}
