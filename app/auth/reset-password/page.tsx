'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return setError('Liên kết đặt lại mật khẩu không hợp lệ.');
    if (!password) return setError('Vui lòng nhập mật khẩu mới.');
    if (password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.',
      );
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
          {!token ? (
            <div className="text-center">
              <div className="grid place-items-center w-16 h-16 rounded-full bg-red-50 mx-auto mb-5">
                <XCircle className="w-9 h-9 text-pin-red" />
              </div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Liên kết không hợp lệ
              </h1>
              <p className="text-mute text-sm leading-relaxed mb-6">
                Không tìm thấy mã đặt lại mật khẩu. Hãy yêu cầu gửi lại email từ trang quên mật khẩu.
              </p>
              <Link href="/auth/forgot-password" className="btn-pin-primary !rounded-full !py-3 w-full justify-center">
                Gửi lại email đặt lại
              </Link>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="grid place-items-center w-16 h-16 rounded-full bg-green-50 mx-auto mb-5">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">
                Đặt lại mật khẩu thành công
              </h1>
              <p className="text-mute text-sm leading-relaxed">
                Mật khẩu mới đã được lưu. Đang chuyển hướng tới trang đăng nhập…
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-ink text-[22px] tracking-tight">
                Đặt lại mật khẩu
              </h1>
              <p className="text-mute text-sm mt-1 mb-6">
                Nhập mật khẩu mới cho tài khoản của bạn.
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
                  <label htmlFor="new-password" className="block text-sm font-bold text-ink mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Ít nhất 8 ký tự"
                      className="pin-input pr-12"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full text-mute hover:text-ink hover:bg-surface-card transition-colors"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-bold text-ink mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Nhập lại mật khẩu"
                    className="pin-input"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-pin-primary w-full !py-3 !rounded-full text-base"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
          <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
