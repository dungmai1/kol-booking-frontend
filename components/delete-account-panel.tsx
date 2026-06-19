'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api/users';
import { ApiError } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DeleteAccountPanel() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const requiredConfirm = 'XOA TAI KHOAN';
  const canSubmit =
    password.trim().length > 0 && confirmText.trim().toUpperCase() === requiredConfirm;

  function resetDialog() {
    setPassword('');
    setConfirmText('');
    setError('');
  }

  async function handleDelete() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await usersApi.deleteAccount({ password });
      toast.success('Đã xoá tài khoản. Email của bạn có thể dùng để đăng ký lại.');
      setOpen(false);
      resetDialog();
      await logout();
      router.replace('/auth/register');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Không thể xoá tài khoản. Vui lòng thử lại.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 md:p-6">
      <h2 className="font-display font-bold text-lg text-ink mb-1">Vùng nguy hiểm</h2>
      <p className="text-sm text-mute mb-4">
        Xoá tài khoản {user?.role === 'KOL' ? 'KOL' : user?.role === 'BRAND' ? 'Brand' : ''} vĩnh viễn.
        Email <span className="font-semibold text-ink">{user?.email}</span> sẽ được giải phóng để bạn có thể
        đăng ký tài khoản mới sau này.
      </p>
      <ul className="text-xs text-mute space-y-1 mb-4 list-disc pl-4">
        <li>Không xoá được khi còn booking đang xử lý hoặc (KOL) còn tiền trong ví.</li>
        <li>Hành động không thể hoàn tác.</li>
      </ul>
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          resetDialog();
          setOpen(true);
        }}
      >
        <Trash2 className="w-4 h-4" />
        Xoá tài khoản
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) {
            setOpen(next);
            if (!next) resetDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá tài khoản</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu và gõ <span className="font-bold text-ink">{requiredConfirm}</span> để xác nhận.
              Email sẽ được giải phóng sau khi xoá.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="delete-password" className="mb-2 block">
                Mật khẩu hiện tại
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="current-password"
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="delete-confirm" className="mb-2 block">
                Gõ {requiredConfirm} để xác nhận
              </Label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                disabled={busy}
                placeholder={requiredConfirm}
              />
            </div>
            {error && (
              <p className="text-sm text-pin-red bg-pin-red/10 border border-pin-red/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Huỷ
            </Button>
            <Button type="button" variant="destructive" disabled={!canSubmit || busy} onClick={() => void handleDelete()}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Xác nhận xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
