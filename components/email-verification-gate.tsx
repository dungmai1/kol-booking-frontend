'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** Routes reachable while logged in but email is not yet verified. */
const UNVERIFIED_ALLOWED_PREFIXES = [
  '/auth/check-email',
  '/auth/verify-email',
  '/auth/email-verified',
  '/auth/reset-password',
  '/reset-password',
];

function isUnverifiedAllowedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return UNVERIFIED_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const needsVerification = isAuthenticated && user !== null && !user.emailVerified;
  const allowedHere = isUnverifiedAllowedPath(pathname);

  useEffect(() => {
    if (isLoading || !needsVerification || allowedHere) return;
    router.replace('/auth/check-email');
  }, [isLoading, needsVerification, allowedHere, router]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (needsVerification && !allowedHere) {
    return (
      <main className="min-h-screen bg-surface-soft grid place-items-center">
        <div className="flex items-center gap-3 text-mute">
          <Loader2 className="w-6 h-6 animate-spin text-pin-red" />
          <span className="text-sm font-semibold">Đang chuyển hướng…</span>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
