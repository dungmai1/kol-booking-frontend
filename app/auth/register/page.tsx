'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { Eye, EyeOff, Loader2, Building2, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TermsContent } from '@/components/legal/terms-content';

type Role = 'BRAND' | 'KOL';

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(pw: string): PasswordStrength {
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",.<>?/]/.test(pw);
  if (pw.length < 8 || (!hasUpper && !hasNumber)) return 'weak';
  if (pw.length >= 8 && hasUpper && hasNumber && hasSpecial) return 'strong';
  return 'medium';
}

const strengthMeta: Record<PasswordStrength, { label: string; color: string; segments: number }> = {
  weak:   { label: 'Yếu',      color: 'bg-red-500',    segments: 1 },
  medium: { label: 'Trung bình', color: 'bg-yellow-400', segments: 2 },
  strong: { label: 'Mạnh',     color: 'bg-green-500',  segments: 3 },
};

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

  // Điều khoản: bắt buộc tick trước khi đăng ký
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);

  // Per-field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  // Server-level error
  const [serverError, setServerError] = useState('');

  // Password touched (show strength bar only after user typed)
  const [passwordTouched, setPasswordTouched] = useState(false);

  function validateEmail(value: string): string {
    if (!value.trim()) return 'Vui lòng nhập email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Email không đúng định dạng.';
    return '';
  }

  function validatePassword(value: string): string {
    if (!value) return 'Vui lòng nhập mật khẩu.';
    if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (!/[A-Z]/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ hoa.';
    if (!/[0-9]/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ số.';
    if (!/[!@#$%^&*()_+\-=\[\]{}|;':",.<>?/]/.test(value))
      return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%…).';
    return '';
  }

  function validateConfirmPassword(value: string): string {
    if (!value) return 'Vui lòng xác nhận mật khẩu.';
    if (value !== password) return 'Mật khẩu xác nhận không khớp.';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(confirmPassword);
    const tErr = agreedTerms ? '' : 'Vui lòng đọc và chấp nhận điều khoản sử dụng để tiếp tục.';

    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cErr);
    setTermsError(tErr);

    if (eErr || pErr || cErr || tErr) return;

    setIsLoading(true);
    try {
      await register({ email, password, role });
      router.push('/auth/check-email');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }

  const pwStrength = passwordTouched && password ? getPasswordStrength(password) : null;
  const meta = pwStrength ? strengthMeta[pwStrength] : null;

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
            {serverError && (
              <div className="rounded-md px-4 py-3 text-sm font-bold" style={{ background: 'var(--success-pale)', color: 'var(--error)' }}>
                {serverError}
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

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder="ban@email.com"
                className={`pin-input${emailError ? ' border-red-500' : ''}`}
              />
              {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordTouched(true);
                    if (passwordError) setPasswordError('');
                    // live-update confirm error when password changes
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
                    } else if (confirmPassword) {
                      setConfirmPasswordError('');
                    }
                  }}
                  onBlur={() => { setPasswordTouched(true); setPasswordError(validatePassword(password)); }}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`pin-input pr-12${passwordError ? ' border-red-500' : ''}`}
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

              {/* Password strength bar */}
              {passwordTouched && password && meta && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          seg <= meta.segments ? meta.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${
                    pwStrength === 'strong' ? 'text-green-600' :
                    pwStrength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Độ mạnh: {meta.label}
                  </p>
                </div>
              )}

              {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (confirmPasswordError) setConfirmPasswordError(''); }}
                onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword))}
                placeholder="••••••••"
                className={`pin-input${confirmPasswordError ? ' border-red-500' : ''}`}
              />
              {confirmPasswordError && <p className="text-xs text-red-600 mt-1">{confirmPasswordError}</p>}
            </div>

            {/* Điều khoản sử dụng — bắt buộc tick trước khi tạo tài khoản */}
            <div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree-terms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => {
                    setAgreedTerms(checked === true);
                    if (checked === true) setTermsError('');
                  }}
                  aria-invalid={!!termsError}
                  className="mt-0.5"
                />
                <label htmlFor="agree-terms" className="text-sm text-body leading-relaxed cursor-pointer">
                  Tôi đã đọc và chấp nhận mọi{' '}
                  <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-pin-red font-semibold underline-offset-2 hover:underline"
                      >
                        điều kiện của nền tảng
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="font-display">Điều khoản sử dụng khi đăng ký tài khoản</DialogTitle>
                        <DialogDescription>
                          Vui lòng đọc kỹ các điều khoản dưới đây trước khi tiếp tục.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="overflow-y-auto pr-1 -mr-1 py-2">
                        <TermsContent />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAgreedTerms(true);
                          setTermsError('');
                          setTermsOpen(false);
                        }}
                        className="btn-pin-primary w-full !py-3 !rounded-full text-base"
                      >
                        Tôi đã đọc và đồng ý
                      </button>
                    </DialogContent>
                  </Dialog>.
                </label>
              </div>
              {termsError && <p className="text-xs text-red-600 mt-2">{termsError}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-pin-primary w-full !py-3 !rounded-full text-base">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Đang tạo tài khoản…' : 'Tiếp tục'}
            </button>
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
