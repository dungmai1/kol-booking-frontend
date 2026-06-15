'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  function startCooldown() {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const target = email.trim();
    if (!target) return setError('Vui lòng nhập email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return setError('Email không đúng định dạng.');
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: target });
      setSubmitted(true);
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
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

        <div className="bg-canvas rounded-[2rem] p-8 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
          {submitted ? (
            <div className="text-center">
              <div className="grid place-items-center w-16 h-16 rounded-full bg-surface-card mx-auto mb-5">
                <Mail className="w-8 h-8 text-pin-red" />
              </div>

              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Kiểm tra hộp thư của bạn
              </h1>

              <p className="text-mute text-sm leading-relaxed mb-1">
                Nếu tài khoản tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu tới
              </p>
              <p className="font-bold text-ink text-sm mb-4">{email.trim()}</p>
              <p className="text-mute text-sm leading-relaxed mb-6">
                Nhấn vào đường dẫn trong email để tạo mật khẩu mới. Liên kết sẽ hết hạn sau một thời gian.
              </p>

              <div className="p-4 rounded-xl bg-surface-card text-xs text-mute leading-relaxed mb-6">
                Không thấy email? Hãy kiểm tra thư mục <span className="font-bold text-ink">Thư rác</span>, hoặc gửi lại bên dưới.
              </div>

              <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold text-[color:var(--success-deep)]">
                <CheckCircle2 className="w-4 h-4" />
                Đã gửi email đặt lại mật khẩu.
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 mb-5">
                {error && (
                  <p className="text-sm font-semibold text-pin-red text-left">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading || cooldown > 0}
                  className="btn-pin-secondary !rounded-full w-full justify-center disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email'}
                </button>
              </form>

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-ink hover:text-pin-red"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight">
                Quên mật khẩu?
              </h1>
              <p className="text-mute text-sm mt-1 mb-6">
                Nhập email đăng ký — chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-md px-4 py-3 text-sm font-bold"
                    style={{ background: '#FEE2E2', color: 'var(--error)', border: '1px solid #FCA5A5' }}
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-bold text-ink mb-2">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ban@email.com"
                    className="pin-input"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-pin-primary w-full !py-3 !rounded-full text-base"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-hairline-soft text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-ink hover:text-pin-red"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
