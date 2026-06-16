'use client';

import { Header } from '@/components/header';
import {
  Wallet as WalletIcon,
  Banknote,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { walletApi } from '@/lib/api/wallet';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import { useAuth } from '@/contexts/AuthContext';
import type {
  WalletResponse,
  WalletTransactionResponse,
  WithdrawResponse,
  TransactionType,
  WithdrawStatus,
} from '@/lib/api/types';

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const txTypeLabel: Record<TransactionType, string> = {
  DEPOSIT: 'Nạp tiền',
  HOLD: 'Tạm giữ',
  RELEASE: 'Giải ngân',
  WITHDRAW: 'Rút tiền',
  REFUND: 'Hoàn tiền',
  FEE: 'Phí nền tảng',
};

const txTypeColor: Record<TransactionType, string> = {
  DEPOSIT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RELEASE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUND: 'bg-purple-50 text-purple-700 border-purple-200',
  HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  WITHDRAW: 'bg-orange-50 text-orange-700 border-orange-200',
  FEE: 'bg-gray-50 text-gray-700 border-gray-200',
};

/** Credits add to the wallet (shown green, +); the rest are debits (−). */
const CREDIT_TYPES: ReadonlySet<TransactionType> = new Set<TransactionType>([
  'DEPOSIT',
  'RELEASE',
  'REFUND',
]);

const withdrawStatusMeta: Record<
  WithdrawStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  PENDING: {
    label: 'Chờ duyệt',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ShieldCheck,
  },
  PAID: {
    label: 'Đã chi trả',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Đã từ chối',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface WithdrawForm {
  open: boolean;
  amount: string;
  bankName: string;
  bankAccount: string;
  accountName: string;
  error: string;
  // per-field errors
  amountError: string;
  bankNameError: string;
  bankAccountError: string;
  accountNameError: string;
}

const EMPTY_FORM: WithdrawForm = {
  open: false,
  amount: '',
  bankName: '',
  bankAccount: '',
  accountName: '',
  error: '',
  amountError: '',
  bankNameError: '',
  bankAccountError: '',
  accountNameError: '',
};

export default function KolWalletPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<WithdrawForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [wRes, tRes, wdRes] = await Promise.allSettled([
        walletApi.getMyWallet(),
        walletApi.getTransactions(0, 20),
        withdrawalsApi.getMyWithdrawals(0, 20),
      ]);
      if (wRes.status === 'fulfilled') {
        setWallet(wRes.value);
      } else if (wRes.reason) {
        setLoadError(
          wRes.reason instanceof Error ? wRes.reason.message : 'Không thể tải ví.',
        );
      }
      if (tRes.status === 'fulfilled') setTransactions(tRes.value.content);
      if (wdRes.status === 'fulfilled') setWithdrawals(wdRes.value.content);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }
    if (user.role !== 'KOL' && user.role !== 'BRAND') {
      setIsLoading(false);
      return;
    }
    void fetchAll();
  }, [authLoading, isAuthenticated, user, fetchAll]);

  // ─── Withdraw field validators ─────────────────────────────────────────────

  function validateWithdrawAmount(v: string, balanceAvailable: number): string {
    if (!v.trim()) return 'Vui lòng nhập số tiền.';
    const n = Number(v);
    if (isNaN(n) || !Number.isFinite(n)) return 'Số tiền không phải là số hợp lệ.';
    if (n <= 0) return 'Số tiền phải lớn hơn 0.';
    if (n < 10_000) return 'Số tiền rút tối thiểu là 10.000 VND.';
    if (n > balanceAvailable) return `Số tiền vượt quá số dư khả dụng (${vnd.format(balanceAvailable)}).`;
    return '';
  }

  function validateBankName(v: string): string {
    if (!v.trim()) return 'Vui lòng nhập tên ngân hàng.';
    if (v.trim().length < 2) return 'Tên ngân hàng phải có ít nhất 2 ký tự.';
    if (v.trim().length > 150) return 'Tên ngân hàng không được vượt quá 150 ký tự.';
    return '';
  }

  function validateBankAccount(v: string): string {
    if (!v.trim()) return 'Vui lòng nhập số tài khoản.';
    if (v.trim().length < 5) return 'Số tài khoản phải có ít nhất 5 ký tự.';
    if (v.trim().length > 50) return 'Số tài khoản không được vượt quá 50 ký tự.';
    if (!/^[0-9-]+$/.test(v.trim())) return 'Số tài khoản chỉ được chứa chữ số và dấu gạch ngang.';
    return '';
  }

  function validateAccountName(v: string): string {
    if (!v.trim()) return 'Vui lòng nhập tên chủ tài khoản.';
    if (v.trim().length < 2) return 'Tên chủ tài khoản phải có ít nhất 2 ký tự.';
    if (v.trim().length > 150) return 'Tên chủ tài khoản không được vượt quá 150 ký tự.';
    return '';
  }

  function openForm() {
    setForm({ ...EMPTY_FORM, open: true });
  }

  function closeForm() {
    if (submitting) return;
    setForm(EMPTY_FORM);
  }

  async function handleSubmitWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const balanceAvailable = wallet?.balanceAvailable ?? 0;

    const aErr = validateWithdrawAmount(form.amount, balanceAvailable);
    const bnErr = validateBankName(form.bankName);
    const baErr = validateBankAccount(form.bankAccount);
    const anErr = validateAccountName(form.accountName);

    setForm((prev) => ({
      ...prev,
      amountError: aErr,
      bankNameError: bnErr,
      bankAccountError: baErr,
      accountNameError: anErr,
      error: '',
    }));

    if (aErr || bnErr || baErr || anErr) return;

    const amount = Number(form.amount);
    setSubmitting(true);
    setForm((prev) => ({ ...prev, error: '' }));
    try {
      const created = await withdrawalsApi.create({
        amount,
        bankName: form.bankName.trim(),
        bankAccount: form.bankAccount.trim(),
        accountName: form.accountName.trim(),
      });
      setWithdrawals((prev) => [created, ...prev]);
      // Refresh wallet to reflect held balance
      try {
        const fresh = await walletApi.getMyWallet();
        setWallet(fresh);
      } catch {
        // non-fatal
      }
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      setForm((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Tạo yêu cầu rút tiền thất bại.',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchAll();
  }

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="h-24 rounded-2xl bg-white border border-gray-200 animate-pulse mb-6" />
            <div className="h-40 rounded-2xl bg-white border border-gray-200 animate-pulse mb-6" />
            <div className="h-72 rounded-2xl bg-white border border-gray-200 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="font-bold text-xl text-gray-900 mb-2">Cần đăng nhập</h1>
            <p className="text-sm text-gray-600 mb-5">
              Bạn cần đăng nhập để xem ví và rút tiền.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (user.role !== 'KOL' && user.role !== 'BRAND') {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <ShieldCheck className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h1 className="font-bold text-xl text-gray-900 mb-2">Không có quyền truy cập</h1>
            <p className="text-sm text-gray-600 mb-5">
              Trang ví chỉ dành cho Brand và KOL. Tài khoản hiện tại của bạn là {user.role}.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </main>
      </>
    );
  }

  const available = wallet?.balanceAvailable ?? 0;
  const held = wallet?.balanceHeld ?? 0;
  const total = available + held;
  const isBrand = user.role === 'BRAND';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ─── Header row ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {isBrand ? 'Ví Brand' : 'Ví KOL'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isBrand
                  ? 'Tiền hoàn từ booking (từ chối nội dung, v.v.) nằm ở số dư khả dụng. Rút ra ngân hàng qua yêu cầu bên dưới — admin xác nhận chuyển khoản thủ công.'
                  : 'Tiền từ booking hoàn tất được cộng vào ví tự động khi Brand nghiệm thu. Rút ra ngân hàng là bước riêng.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Làm mới
              </button>
              <button
                type="button"
                onClick={openForm}
                disabled={available <= 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Yêu cầu rút tiền
              </button>
            </div>
          </div>

          {loadError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {/* ─── Balance cards ───────────────────────────────────────────── */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-3 opacity-90">
                <WalletIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Khả dụng
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold">
                {vnd.format(available)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {isBrand
                  ? 'Hoàn tiền và số dư có thể rút ra ngân hàng'
                  : 'Từ booking đã hoàn tất — rút được ngay'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-amber-600">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Đang giữ
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {vnd.format(held)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {isBrand
                  ? 'Escrow các booking đang chạy hoặc yêu cầu rút đang chờ'
                  : 'Yêu cầu rút đang chờ admin chuyển khoản'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <Banknote className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Tổng
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {vnd.format(total)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Đơn vị: {wallet?.currency ?? 'VND'}
              </p>
            </div>
          </div>

          {/* ─── Two-column: transactions + withdrawals ──────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Transactions */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-gray-600" />
                <h2 className="font-bold text-gray-900">Giao dịch gần đây</h2>
                <span className="ml-auto text-xs text-gray-500">
                  {transactions.length} mục
                </span>
              </header>
              {transactions.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-gray-500">
                  Chưa có giao dịch nào.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const isCredit = CREDIT_TYPES.has(tx.type);
                    return (
                      <li
                        key={tx.id}
                        className="px-5 py-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${txTypeColor[tx.type]}`}
                            >
                              {txTypeLabel[tx.type]}
                            </span>
                            {tx.bookingId && (
                              <Link
                                href={`/bookings/${tx.bookingId}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Đơn #{tx.bookingId}
                              </Link>
                            )}
                          </div>
                          {tx.note && (
                            <p className="text-sm text-gray-700 truncate">{tx.note}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`font-bold text-sm ${
                              isCredit ? 'text-emerald-600' : 'text-gray-900'
                            }`}
                          >
                            {isCredit ? '+' : '−'}
                            {vnd.format(Math.abs(tx.amount))}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Sau GD: {vnd.format(tx.balanceAfter)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Withdrawals */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-gray-600" />
                <h2 className="font-bold text-gray-900">Yêu cầu rút tiền</h2>
                <span className="ml-auto text-xs text-gray-500">
                  {withdrawals.length} mục
                </span>
              </header>
              {withdrawals.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-gray-500">
                  Chưa có yêu cầu rút tiền nào.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {withdrawals.map((wd) => {
                    const meta = withdrawStatusMeta[wd.status];
                    const StatusIcon = meta.icon;
                    return (
                      <li key={wd.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900">
                              {vnd.format(wd.amount)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDateTime(wd.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border ${meta.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p>
                            <span className="text-gray-500">Ngân hàng:</span>{' '}
                            <span className="font-medium text-gray-800">
                              {wd.bankName}
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-500">STK:</span>{' '}
                            <span className="font-medium text-gray-800">
                              {wd.bankAccount}
                            </span>{' '}
                            • {wd.accountName}
                          </p>
                          {wd.rejectReason && (
                            <p className="text-red-600 mt-1">
                              Lý do từ chối: {wd.rejectReason}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ─── Withdraw modal ───────────────────────────────────────────── */}
      {form.open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          onClick={closeForm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2
                  id="withdraw-title"
                  className="font-extrabold text-xl text-gray-900"
                >
                  Yêu cầu rút tiền
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Số dư khả dụng:{' '}
                  <span className="font-bold text-gray-900">
                    {vnd.format(available)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                aria-label="Đóng"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdraw} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1.5 block">
                  Số tiền muốn rút <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={10000}
                  step={1000}
                  autoFocus
                  placeholder="VD: 1000000 (tối thiểu 10.000)"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value, amountError: '', error: '' }))
                  }
                  onBlur={() =>
                    setForm((prev) => ({
                      ...prev,
                      amountError: validateWithdrawAmount(prev.amount, wallet?.balanceAvailable ?? 0),
                    }))
                  }
                  disabled={submitting}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none text-sm disabled:opacity-50 ${
                    form.amountError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                {form.amountError && (
                  <p className="text-xs text-red-600 mt-1">{form.amountError}</p>
                )}
              </div>

              {/* Bank name */}
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1.5 block">
                  Ngân hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Vietcombank"
                  value={form.bankName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bankName: e.target.value, bankNameError: '', error: '' }))
                  }
                  onBlur={() =>
                    setForm((prev) => ({
                      ...prev,
                      bankNameError: validateBankName(prev.bankName),
                    }))
                  }
                  disabled={submitting}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none text-sm disabled:opacity-50 ${
                    form.bankNameError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                {form.bankNameError && (
                  <p className="text-xs text-red-600 mt-1">{form.bankNameError}</p>
                )}
              </div>

              {/* Bank account */}
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1.5 block">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 0123456789"
                  value={form.bankAccount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      bankAccount: e.target.value,
                      bankAccountError: '',
                      error: '',
                    }))
                  }
                  onBlur={() =>
                    setForm((prev) => ({
                      ...prev,
                      bankAccountError: validateBankAccount(prev.bankAccount),
                    }))
                  }
                  disabled={submitting}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none text-sm disabled:opacity-50 ${
                    form.bankAccountError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                {form.bankAccountError && (
                  <p className="text-xs text-red-600 mt-1">{form.bankAccountError}</p>
                )}
              </div>

              {/* Account name */}
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1.5 block">
                  Tên chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Họ và tên (không dấu)"
                  value={form.accountName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      accountName: e.target.value,
                      accountNameError: '',
                      error: '',
                    }))
                  }
                  onBlur={() =>
                    setForm((prev) => ({
                      ...prev,
                      accountNameError: validateAccountName(prev.accountName),
                    }))
                  }
                  disabled={submitting}
                  className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none text-sm disabled:opacity-50 ${
                    form.accountNameError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                {form.accountNameError && (
                  <p className="text-xs text-red-600 mt-1">{form.accountNameError}</p>
                )}
              </div>

              {form.error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {form.error}
                </p>
              )}

              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                {isBrand
                  ? 'Admin sẽ chuyển khoản thủ công sau khi nhận yêu cầu. Số tiền tạm giữ cho đến khi hoàn tất hoặc bị từ chối.'
                  : 'Tiền booking vào ví ngay khi Brand nghiệm thu (không cần admin duyệt). Rút ra ngân hàng là yêu cầu riêng — số tiền sẽ tạm giữ cho đến khi chuyển khoản xong.'}
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.amount.trim() ||
                    !!form.amountError ||
                    !!form.bankNameError ||
                    !!form.bankAccountError ||
                    !!form.accountNameError
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="w-4 h-4" />
                  )}
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
