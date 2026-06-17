'use client';

import { Suspense, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPostAuthRedirectPath } from '@/lib/auth/post-auth-redirect';
import { parseHashAuthTokens } from '@/lib/auth/parse-hash-tokens';

type Status = 'loading' | 'success' | 'error';

function EmailVerifiedContent() {
  const router = useRouter();
  const { establishSessionFromTokens } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useLayoutEffect(() => {
    const tokens = parseHashAuthTokens();
    if (!tokens) {
      setErrorMsg('Liên kết xác nhận không hợp lệ hoặc đã hết hạn.');
      setStatus('error');
      return;
    }

    // Remove tokens from the address bar as soon as they are read.
    window.history.replaceState(null, '', window.location.pathname);

    establishSessionFromTokens(tokens, true);
    setStatus('success');

    const redirectTo = getPostAuthRedirectPath(tokens.role);
    const timer = window.setTimeout(() => router.replace(redirectTo), 1500);
    return () => window.clearTimeout(timer);
  }, [establishSessionFromTokens, router]);

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="relative w-full max-w-[440px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-pin-red text-on-dark font-extrabold text-lg">K</span>
            <span className="font-display font-extrabold text-2xl text-pin-red tracking-tight">KOL Hub</span>
          </Link>
        </div>

        <div className="bg-canvas rounded-[2rem] p-8 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)] text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-pin-red animate-spin mx-auto mb-4" />
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Đang đăng nhập…
              </h1>
              <p className="text-mute text-sm">Email đã được xác nhận. Vui lòng chờ trong giây lát.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="grid place-items-center w-16 h-16 rounded-full bg-green-50 mx-auto mb-5">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Xác nhận thành công!
              </h1>
              <p className="text-mute text-sm leading-relaxed">
                Tài khoản của bạn đã sẵn sàng. Đang chuyển hướng…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="grid place-items-center w-16 h-16 rounded-full bg-red-50 mx-auto mb-5">
                <XCircle className="w-9 h-9 text-pin-red" />
              </div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Không thể hoàn tất xác nhận
              </h1>
              <p className="text-mute text-sm leading-relaxed mb-6">{errorMsg}</p>
              <div className="flex flex-col gap-3">
                <Link href="/auth/login" className="btn-pin-primary !rounded-full !py-3 justify-center">
                  Đăng nhập
                </Link>
                <Link href="/auth/check-email" className="text-sm font-bold text-ink hover:text-pin-red">
                  Gửi lại email xác nhận
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
          <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
        </div>
      }
    >
      <EmailVerifiedContent />
    </Suspense>
  );
}
