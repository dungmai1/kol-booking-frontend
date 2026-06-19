'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserStatus } from '@/lib/api/types';

const BLOCKED_STATUSES: UserStatus[] = ['BANNED', 'INACTIVE'];

const ALLOWED_PREFIXES = ['/auth/login', '/auth/register'];

function isAllowedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AccountStatusGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const blocked =
    isAuthenticated &&
    user !== null &&
    BLOCKED_STATUSES.includes(user.status);

  useEffect(() => {
    if (isLoading || !blocked || isAllowedPath(pathname)) return;
    void logout();
  }, [isLoading, blocked, pathname, logout]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (blocked && !isAllowedPath(pathname)) {
    const isBanned = user?.status === 'BANNED';
    return (
      <main className="min-h-screen bg-surface-soft grid place-items-center p-4">
        <div className="bg-canvas rounded-[2rem] p-8 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)] max-w-[440px] w-full text-center">
          <div className="grid place-items-center w-16 h-16 rounded-full bg-red-50 mx-auto mb-5">
            <ShieldX className="w-9 h-9 text-pin-red" />
          </div>
          <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
            {isBanned ? 'Tài khoản đã bị cấm' : 'Tài khoản đã bị vô hiệu hóa'}
          </h1>
          <p className="text-mute text-sm leading-relaxed mb-6">
            {isBanned
              ? 'Tài khoản của bạn đã bị admin cấm và không thể sử dụng dịch vụ. Liên hệ hỗ trợ nếu bạn cho rằng đây là nhầm lẫn.'
              : 'Tài khoản này đã bị xoá hoặc vô hiệu hóa. Vui lòng đăng nhập bằng tài khoản khác.'}
          </p>
          <Link href="/auth/login" className="btn-pin-primary !rounded-full !py-3 w-full justify-center">
            Về trang đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
