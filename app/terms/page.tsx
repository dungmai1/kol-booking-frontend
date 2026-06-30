import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { TermsContent } from '@/components/legal/terms-content';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng — KOLBooking',
  description: 'Điều khoản sử dụng khi đăng ký tài khoản trên nền tảng KOLBooking.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="bg-surface-soft text-body min-h-screen">
        <div className="mx-auto max-w-[760px] px-4 sm:px-6 py-12 md:py-16">
          <h1 className="font-display font-extrabold text-ink text-[28px] md:text-[36px] tracking-tight mb-2">
            Điều khoản sử dụng khi đăng ký tài khoản
          </h1>
          <p className="text-mute text-sm mb-8">
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi đăng ký và sử dụng nền tảng.
          </p>

          <div className="bg-canvas rounded-[2rem] p-6 md:p-10 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.10)]">
            <TermsContent />
          </div>
        </div>
      </main>
    </>
  );
}
