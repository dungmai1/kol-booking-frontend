'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * Login — adapts the Pinterest `modal-card` (DESIGN.md §Components):
 * canvas surface, 32px radius, 32px padding, double-ring focus inputs,
 * Pinterest-red "Continue", and a soft cream scrim under the modal.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Vui lòng nhập email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Email không đúng định dạng.');
    }
    if (!password) return setError('Vui lòng nhập mật khẩu.');
    setIsLoading(true);
    try {
      const tokens = await login({ email, password });
      if (tokens.role === 'ADMIN') router.push('/admin');
      else if (tokens.role === 'KOL') router.push('/kol-dashboard/me');
      else router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-surface-soft flex items-center justify-center p-4">
      {/* Decorative pin-board scrim — adds Pinterest atmosphere without an image */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-6 gap-2 p-4 opacity-50">
        {DECOR_TILES.map((t, i) => (
          <div
            key={i}
            className={`rounded-md ${t.ratio}`}
            style={{ background: t.bg, gridColumn: t.col, gridRow: t.row }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Brand mark */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-pin-red text-on-dark font-extrabold text-lg">K</span>
            <span className="font-display font-extrabold text-2xl text-pin-red tracking-tight">KOL Hub</span>
          </Link>
        </div>

        {/* Modal card — 32px radius, 32px padding, soft 16px ambient shadow */}
        <div className="bg-canvas rounded-[2rem] p-8 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
          <h1 className="font-display font-bold text-ink text-[22px] tracking-tight">
            Chào mừng trở lại
          </h1>
          <p className="text-mute text-sm mt-1 mb-6">
            Đăng nhập để tiếp tục đặt KOL cho chiến dịch.
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
              <label className="block text-sm font-bold text-ink mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ban@email.com"
                className="pin-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-ink mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pin-input pr-12"
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

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm font-bold text-ink-soft hover:text-pin-red">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-pin-primary w-full !py-3 !rounded-full text-base"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Đang đăng nhập…' : 'Tiếp tục'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-hairline-soft text-center">
            <span className="text-sm text-mute">Chưa có tài khoản? </span>
            <Link href="/auth/register" className="text-sm font-bold text-ink hover:text-pin-red">
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const DECOR_TILES: Array<{ ratio: string; bg: string; col: string; row: string }> = [
  { ratio: 'aspect-[3/4]', bg: 'linear-gradient(160deg,#f6dccb,#d8a785)', col: '1 / span 1', row: '1 / span 2' },
  { ratio: 'aspect-square', bg: 'linear-gradient(150deg,#e9d5e6,#b287b3)', col: '1 / span 1', row: '3 / span 1' },
  { ratio: 'aspect-square', bg: 'linear-gradient(160deg,#d6e3dd,#82a193)', col: '1 / span 1', row: '4 / span 1' },
  { ratio: 'aspect-[3/4]', bg: 'linear-gradient(150deg,#f1d9c6,#c5825a)', col: '6 / span 1', row: '1 / span 2' },
  { ratio: 'aspect-square', bg: 'linear-gradient(140deg,#e3dccd,#a59b80)', col: '6 / span 1', row: '3 / span 1' },
  { ratio: 'aspect-[4/5]', bg: 'linear-gradient(150deg,#dde6df,#a3b9ac)', col: '6 / span 1', row: '4 / span 1' },
];
