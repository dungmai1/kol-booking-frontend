'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const RESEND_COOLDOWN_SECONDS = 60;

export default function CheckEmailPage() {
  const { user } = useAuth();
  const dashboardHref =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'KOL' ? '/kol-dashboard/me' : '/dashboard';

  // The email is known after register/login; allow manual entry as a fallback
  // (e.g. when the page is opened in a fresh tab without a session).
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const target = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }
    setSending(true);
    try {
      await authApi.resendVerification({ email: target });
      // Backend always returns success (it never leaks whether the email exists).
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được email. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

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
            <span className="font-bold text-ink">Junk Mail</span>, hoặc gửi lại bên dưới.
          </div>

          {/* Resend block */}
          {sent ? (
            <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold text-[color:var(--success-deep)]">
              <CheckCircle2 className="w-4 h-4" />
              Đã gửi lại email xác nhận.
            </div>
          ) : null}

          <form onSubmit={handleResend} className="space-y-3 mb-5 text-left">
            {!user?.email && (
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="ban@email.com"
                className="pin-input"
                aria-label="Email"
              />
            )}
            {error && <p className="text-sm font-semibold text-pin-red">{error}</p>}
            <button
              type="submit"
              disabled={sending || cooldown > 0}
              className="btn-pin-secondary !rounded-full w-full justify-center disabled:opacity-50"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email xác nhận'}
            </button>
          </form>

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
