'use client';

import { Header } from '@/components/header';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Cơ bản',
    price: 'Miễn phí',
    period: 'Mãi mãi',
    description: 'Dành cho thương hiệu mới bắt đầu.',
    features: ['Duyệt hồ sơ KOL', 'Tìm kiếm trên mọi danh mục', 'Xem đánh giá công khai', '1 đơn đặt đang hoạt động', 'Hỗ trợ qua email'],
    cta: 'Bắt đầu ngay',
    href: '/auth/register',
    popular: false,
  },
  {
    name: 'Chuyên nghiệp',
    price: '$29',
    period: '/ tháng',
    description: 'Dành cho thương hiệu đang mở rộng chiến dịch.',
    features: ['Mọi tính năng Cơ bản', '10 đơn đặt đang hoạt động', 'Bộ lọc nâng cao', 'Nhắn tin ưu tiên', 'Phân tích chiến dịch', 'Mẫu hợp đồng', 'Bảo vệ thanh toán'],
    cta: 'Dùng thử 14 ngày',
    href: '/auth/register',
    popular: true,
  },
  {
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    period: 'báo giá',
    description: 'Dành cho agency quản lý nhiều khách hàng.',
    features: ['Mọi tính năng Chuyên nghiệp', 'Đơn đặt không giới hạn', 'Quản lý nhóm', 'Quy trình tùy chỉnh', 'Truy cập API', 'Quản lý tài khoản riêng', 'Hỗ trợ 24/7'],
    cta: 'Liên hệ',
    href: '#contact',
    popular: false,
  },
];

const faqs = [
  { q: 'Tôi có thể đổi gói bất cứ lúc nào không?', a: 'Có. Bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào — thay đổi áp dụng từ chu kỳ kế tiếp.' },
  { q: 'Các phương thức thanh toán nào được chấp nhận?', a: 'Visa, Mastercard, American Express, PayPal và chuyển khoản ngân hàng (gói Doanh nghiệp).' },
  { q: 'Có giảm giá khi thanh toán theo năm không?', a: 'Có, giảm 20% khi bạn thanh toán theo năm.' },
  { q: 'Có bản dùng thử miễn phí không?', a: 'Gói Cơ bản miễn phí vĩnh viễn. Gói Chuyên nghiệp và Doanh nghiệp có 14 ngày dùng thử.' },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {/* Hero — magazine layout, no gradient banner */}
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-12 md:pt-20 pb-12 md:pb-16 text-center">
          <p className="text-pin-red font-bold text-sm uppercase tracking-[0.2em] mb-6">Bảng giá</p>
          <h1 className="font-display font-extrabold text-ink leading-[1.05] text-[44px] sm:text-[56px] lg:text-[70px] tracking-[-1.2px] max-w-3xl mx-auto">
            Đơn giản, minh bạch, không bất ngờ
          </h1>
          <p className="mt-6 text-body text-base lg:text-lg max-w-xl mx-auto">
            Chọn gói phù hợp với thương hiệu của bạn — bắt đầu miễn phí, nâng cấp khi sẵn sàng.
          </p>
        </section>

        {/* Plan tiles */}
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-md border p-8 flex flex-col ${
                  plan.popular ? 'bg-canvas border-ink' : 'bg-canvas border-hairline'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-8 inline-flex items-center bg-pin-red text-on-dark font-bold rounded-full px-3 py-1 text-xs">
                    Phổ biến
                  </span>
                )}

                <h3 className="font-display font-bold text-ink text-[24px] tracking-tight">{plan.name}</h3>
                <p className="text-mute text-sm mt-1 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="font-display font-extrabold text-ink text-[44px] tracking-[-1.2px]">{plan.price}</span>
                  <span className="text-mute text-sm ml-2">{plan.period}</span>
                </div>

                <Link
                  href={plan.href}
                  className={`${plan.popular ? 'btn-pin-primary' : 'btn-pin-secondary'} !rounded-full !py-3 mb-8 justify-center`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-body">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-surface-card mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-ink" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-canvas border-y border-hairline">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
            <h2 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px] mb-10 text-center">
              Câu hỏi thường gặp
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group bg-surface-card rounded-md p-5 cursor-pointer">
                  <summary className="font-bold text-ink text-base flex items-center justify-between list-none">
                    {faq.q}
                    <span className="text-pin-red font-display text-2xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-body text-sm leading-relaxed mt-3">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Dark CTA strip */}
        <section className="bg-surface-dark text-on-dark">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 md:py-14 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
              <h3 className="font-display font-bold text-on-dark text-[24px] md:text-[28px] tracking-[-0.6px]">
                Bắt đầu đặt KOL ngay hôm nay
              </h3>
              <p className="mt-2 text-stone text-sm md:text-base">
                Tài khoản miễn phí, không thẻ tín dụng. Hủy bất cứ lúc nào.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <Link href="/auth/register" className="btn-pin-primary !rounded-full !px-6 !py-3 text-sm">
                Bắt đầu miễn phí
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
