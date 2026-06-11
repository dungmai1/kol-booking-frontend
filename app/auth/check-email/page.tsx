'use client';

import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckEmailPage() {
  const { user } = useAuth();
  const dashboardHref = user?.role === 'KOL' ? '/kol-dashboard/me' : '/dashboard';

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
          <div className="grid place-items-center w-16 h-16 rounded-full bg-surface-card mx-auto mb-5">
            <Mail className="w-8 h-8 text-pin-red" />
          </div>

          <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
            Kiểm tra hộp thư của bạn
          </h1>

          <p className="text-mute text-sm leading-relaxed mb-1">
            Chúng tôi đã gửi email xác nhận tới
          </p>
          {user?.email && (
            <p className="font-bold text-ink text-sm mb-4">{user.email}</p>
          )}
          <p className="text-mute text-sm leading-relaxed mb-6">
            Nhấn vào đường dẫn trong email để kích hoạt tài khoản và bắt đầu sử dụng KOL Hub.
          </p>

          <div className="p-4 rounded-xl bg-surface-card text-xs text-mute leading-relaxed mb-6">
            Không thấy email? Hãy kiểm tra thư mục <span className="font-bold text-ink">Spam</span> hoặc{' '}
            <span className="font-bold text-ink">Junk Mail</span>.
          </div>

          <Link
            href={dashboardHref}
            className="btn-pin-primary !rounded-full !py-3 w-full justify-center mb-3"
          >
            Vào trang chủ ngay
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-bold text-ink hover:text-pin-red"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
