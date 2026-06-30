'use client';

import { useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus, Minus } from 'lucide-react';

/**
 * IntroFaq — phần giới thiệu nền tảng đặt trên trang chủ, trình bày dạng
 * accordion "Câu hỏi thường gặp" (tiêu đề + dấu cộng; bấm vào dấu cộng thì
 * xổ nội dung) theo phong cách bookkol.com.
 *
 * Nội dung lấy từ tài liệu yêu cầu (giới thiệu KOLBooking + phí dịch vụ 10%).
 */

type FaqItem = {
  q: string;
  /** Các đoạn văn của câu trả lời. */
  paragraphs?: string[];
  /** Danh sách gạch đầu dòng (dùng cho mục phí dịch vụ). */
  bullets?: string[];
  /** Đoạn kết sau danh sách bullet. */
  outro?: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'KOLBooking là gì?',
    paragraphs: [
      'KOLBooking là nền tảng kết nối giữa Brand và KOL, giúp doanh nghiệp dễ dàng tìm kiếm nhà sáng tạo nội dung phù hợp, đồng thời hỗ trợ KOL tiếp cận nhiều cơ hội hợp tác với các thương hiệu trên cùng một hệ thống.',
    ],
  },
  {
    q: 'AI Assistant trên nền tảng hoạt động như thế nào?',
    paragraphs: [
      'Nền tảng tích hợp AI Assistant cho phép Brand tìm kiếm KOL bằng ngôn ngữ tự nhiên thay vì chỉ sử dụng các bộ lọc truyền thống. AI sẽ phân tích nhu cầu, trích xuất các tiêu chí quan trọng và đề xuất danh sách KOL phù hợp, giúp tiết kiệm thời gian và nâng cao hiệu quả lựa chọn.',
    ],
  },
  {
    q: 'Quy trình hợp tác diễn ra như thế nào?',
    paragraphs: [
      'KOLBooking cung cấp quy trình hợp tác khép kín từ tạo chiến dịch, gửi booking, xác nhận hợp tác, thanh toán, nghiệm thu đến đánh giá sau chiến dịch. Mọi giao dịch đều được quản lý minh bạch nhằm đảm bảo quyền lợi của cả Brand và KOL.',
    ],
  },
  {
    q: 'Phí dịch vụ trên KOLBooking là bao nhiêu?',
    paragraphs: [
      'Để duy trì, vận hành và phát triển nền tảng, KOLBooking áp dụng mức phí dịch vụ 10% trên giá trị mỗi giao dịch booking thành công. Khoản phí này được sử dụng để:',
    ],
    bullets: [
      'Duy trì và nâng cấp hệ thống.',
      'Vận hành AI Assistant và các dịch vụ hỗ trợ.',
      'Đảm bảo quy trình giao dịch minh bạch và an toàn.',
      'Hỗ trợ xử lý khiếu nại, tranh chấp và chăm sóc khách hàng.',
    ],
    outro:
      'Phần còn lại của giá trị hợp đồng sẽ được giải ngân cho KOL sau khi chiến dịch hoàn thành và được Brand nghiệm thu theo quy định của nền tảng.',
  },
];

export function IntroFaq() {
  const [openValue, setOpenValue] = useState<string>('');
  return (
    <section className="mx-auto max-w-[860px] px-4 sm:px-6 py-16 md:py-20">
      <p className="text-pin-red font-bold text-sm uppercase tracking-[0.2em] mb-3 text-center">
        Tìm hiểu thêm
      </p>
      <h2 className="font-display font-bold text-ink text-[28px] lg:text-[40px] tracking-[-0.8px] text-center mb-3">
        Câu hỏi thường gặp
      </h2>
      <p className="text-body text-base text-center max-w-2xl mx-auto mb-10">
        KOLBooking — Nền tảng kết nối Brand và KOL thông minh.
      </p>

      <Accordion value={openValue} onValueChange={setOpenValue}>
        {FAQ_ITEMS.map((item, i) => {
          const value = `item-${i}`;
          const isOpen = openValue === value;
          return (
          <AccordionPrimitive.Item
            key={item.q}
            value={value}
            className="border-b border-hairline-soft"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="group flex flex-1 items-center justify-between gap-4 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-pin-red/40 rounded-md">
                <span className="font-display font-bold text-ink text-base md:text-lg">
                  {item.q}
                </span>
                <span
                  className="grid place-items-center w-8 h-8 shrink-0 rounded-full transition-colors"
                  style={{
                    backgroundColor: isOpen ? 'var(--pin-red)' : 'var(--surface-card)',
                    color: isOpen ? 'var(--on-dark)' : 'var(--ink)',
                  }}
                >
                  {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="pb-5 pr-12 space-y-3 text-body text-sm md:text-base leading-relaxed">
                {item.paragraphs?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {item.bullets && (
                  <ul className="space-y-1.5">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pin-red" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {item.outro && <p>{item.outro}</p>}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
          );
        })}
      </Accordion>

      <p className="text-center text-ink font-display font-semibold text-base md:text-lg mt-10">
        KOLBooking — Kết nối đúng người, hợp tác hiệu quả, phát triển bền vững.
      </p>
      <p className="text-center text-sm text-mute mt-2">
        Tìm hiểu thêm tại{' '}
        <a
          href="https://bookkol.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pin-red font-semibold hover:underline"
        >
          bookkol.com
        </a>
      </p>
    </section>
  );
}

function Accordion({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <AccordionPrimitive.Root type="single" collapsible value={value} onValueChange={onValueChange}>
      {children}
    </AccordionPrimitive.Root>
  );
}
