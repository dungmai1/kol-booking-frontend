'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { Eye, EyeOff, Loader2, Building2, Star } from 'lucide-react';

type Role = 'BRAND' | 'KOL';

/**
 * Register — twin of the login `modal-card`. Adds a role picker
 * implemented as two radio-like cards: each is a small surface-card
 * tile that flips to ink-on-canvas when active (mirrors the chip
 * inversion pattern from DESIGN.md §Filter & Tab Chips).
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('BRAND');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
    if (password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    setIsLoading(true);
    try {
      await register({ email, password, role });
      router.push(role === 'KOL' ? '/kol-dashboard/me' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="relative w-full max-w-[480px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-pin-red text-on-dark font-extrabold text-lg">K</span>
            <span className="font-display font-extrabold text-2xl text-pin-red tracking-tight">KOL Hub</span>
          </Link>
        </div>

        <div className="bg-canvas rounded-[2rem] p-8 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
          <h1 className="font-display font-bold text-ink text-[22px] tracking-tight">Tạo tài khoản</h1>
          <p className="text-mute text-sm mt-1 mb-6">
            Bắt đầu hành trình của bạn — miễn phí, không cần thẻ.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md px-4 py-3 text-sm font-bold" style={{ background: 'var(--success-pale)', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            {/* Role picker — chip-inversion pattern */}
            <div>
              <label className="block text-sm font-bold text-ink mb-3">Bạn là?</label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  active={role === 'BRAND'}
                  onClick={() => setRole('BRAND')}
                  icon={<Building2 className="w-6 h-6" />}
                  title="Thương hiệu"
                  desc="Tìm và đặt KOL"
                />
                <RoleCard
                  active={role === 'KOL'}
                  onClick={() => setRole('KOL')}
                  icon={<Star className="w-6 h-6" />}
                  title="Nhà sáng tạo"
                  desc="Nhận đơn đặt"
                />
              </div>
            </div>

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
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
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

            <div>
              <label className="block text-sm font-bold text-ink mb-2">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="pin-input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-pin-primary w-full !py-3 !rounded-full text-base">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Đang tạo tài khoản…' : 'Tiếp tục'}
            </button>

            <p className="text-xs text-mute text-center leading-relaxed">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <Link href="/terms" className="text-ink-soft font-semibold hover:text-pin-red">Điều khoản</Link>
              {' '}và{' '}
              <Link href="/privacy" className="text-ink-soft font-semibold hover:text-pin-red">Chính sách bảo mật</Link>.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-hairline-soft text-center">
            <span className="text-sm text-mute">Đã có tài khoản? </span>
            <Link href="/auth/login" className="text-sm font-bold text-ink hover:text-pin-red">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-md transition-colors text-left ${
        active
          ? 'bg-ink text-on-dark'
          : 'bg-surface-card text-ink hover:bg-secondary-bg'
      }`}
      aria-pressed={active}
    >
      <span className={`grid place-items-center w-10 h-10 rounded-full ${active ? 'bg-canvas/15 text-on-dark' : 'bg-canvas text-ink'}`}>
        {icon}
      </span>
      <span className="font-bold text-sm">{title}</span>
      <span className={`text-xs ${active ? 'text-stone' : 'text-mute'}`}>{desc}</span>
    </button>
  );
}
