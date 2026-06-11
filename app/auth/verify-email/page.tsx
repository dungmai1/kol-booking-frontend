'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'loading' | 'success' | 'error' | 'missing';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, markEmailVerified } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('missing');
      return;
    }

    authApi
      .verifyEmail({ token })
      .then(() => {
        markEmailVerified();
        setStatus('success');
        // Redirect after 2 seconds
        const role = user?.role;
        setTimeout(() => {
          if (role === 'KOL') router.push('/kol-dashboard/me');
          else router.push('/dashboard');
        }, 2000);
      })
      .catch((err) => {
        setErrorMsg(err instanceof ApiError ? err.message : 'Đường dẫn xác nhận không hợp lệ hoặc đã hết hạn.');
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                Đang xác nhận…
              </h1>
              <p className="text-mute text-sm">Vui lòng chờ trong giây lát.</p>
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
                Email của bạn đã được xác nhận. Đang chuyển hướng vào trang chủ…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="grid place-items-center w-16 h-16 rounded-full bg-red-50 mx-auto mb-5">
                <XCircle className="w-9 h-9 text-pin-red" />
              </div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Xác nhận thất bại
              </h1>
              <p className="text-mute text-sm leading-relaxed mb-6">
                {errorMsg}
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/auth/check-email" className="btn-pin-primary !rounded-full !py-3 justify-center">
                  Về trang kiểm tra email
                </Link>
                <Link href="/auth/login" className="text-sm font-bold text-ink hover:text-pin-red">
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}

          {status === 'missing' && (
            <>
              <div className="grid place-items-center w-16 h-16 rounded-full bg-red-50 mx-auto mb-5">
                <XCircle className="w-9 h-9 text-pin-red" />
              </div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Đường dẫn không hợp lệ
              </h1>
              <p className="text-mute text-sm leading-relaxed mb-6">
                Không tìm thấy mã xác nhận trong đường dẫn này.
              </p>
              <Link href="/auth/login" className="text-sm font-bold text-ink hover:text-pin-red">
                Quay lại đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
