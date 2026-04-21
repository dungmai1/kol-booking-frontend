'use client';

import { Header } from '@/components/header';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Cơ bản',
      price: 'Miễn phí',
      period: 'Mãi mãi',
      description: 'Dành cho các thương hiệu mới bắt đầu',
      features: [
        'Duyệt hồ sơ KOL',
        'Tìm kiếm trên mọi danh mục',
        'Xem đánh giá & nhận xét công khai',
        '1 đơn đặt đang hoạt động',
        'Hỗ trợ qua email',
        'Truy cập hơn 500 KOL',
      ],
      cta: 'Bắt đầu ngay',
      popular: false,
    },
    {
      name: 'Chuyên nghiệp',
      price: '$29',
      period: 'mỗi tháng',
      description: 'Dành cho thương hiệu đang mở rộng chiến dịch',
      features: [
        'Mọi tính năng của gói Cơ bản',
        '10 đơn đặt đang hoạt động',
        'Bộ lọc & tìm kiếm nâng cao',
        'Nhắn tin ưu tiên',
        'Phân tích chiến dịch',
        'Mẫu hợp đồng có sẵn',
        'Bảo vệ thanh toán',
        'Hỗ trợ ưu tiên',
      ],
      cta: 'Dùng thử miễn phí',
      popular: true,
    },
    {
      name: 'Doanh nghiệp',
      price: 'Liên hệ',
      period: 'báo giá',
      description: 'Dành cho agency quản lý nhiều khách hàng',
      features: [
        'Mọi tính năng của gói Chuyên nghiệp',
        'Đơn đặt không giới hạn',
        'Quản lý nhóm',
        'Quy trình tùy chỉnh',
        'Truy cập API',
        'Quản lý tài khoản riêng',
        'Tùy chọn white-label',
        'Hỗ trợ điện thoại 24/7',
      ],
      cta: 'Liên hệ bán hàng',
      popular: false,
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">Bảng giá đơn giản, minh bạch</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Chọn gói phù hợp với thương hiệu của bạn và bắt đầu đặt KOL ngay hôm nay
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`rounded-lg border ${
                    plan.popular
                      ? 'border-blue-600 shadow-lg scale-105'
                      : 'border-gray-200 hover:shadow-md transition-shadow'
                  } overflow-hidden`}
                >
                  {/* Badge */}
                  {plan.popular && (
                    <div className="bg-blue-600 text-white text-center py-2 text-sm font-bold">
                      Phổ biến nhất
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-8">
                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>

                    {/* CTA Button */}
                    <button
                      className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 mb-8 transition-colors ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Features */}
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Câu hỏi thường gặp</h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Tôi có thể đổi gói bất cứ lúc nào không?',
                  a: 'Có! Bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Thay đổi sẽ được áp dụng ở chu kỳ thanh toán kế tiếp.',
                },
                {
                  q: 'Các phương thức thanh toán nào được chấp nhận?',
                  a: 'Chúng tôi chấp nhận các thẻ tín dụng phổ biến (Visa, Mastercard, American Express), PayPal và chuyển khoản ngân hàng cho gói Doanh nghiệp.',
                },
                {
                  q: 'Có giảm giá khi thanh toán theo năm không?',
                  a: 'Có, chúng tôi giảm 20% khi bạn thanh toán theo năm. Liên hệ đội ngũ bán hàng để biết thêm về ưu đãi số lượng lớn.',
                },
                {
                  q: 'Có bản dùng thử miễn phí không?',
                  a: 'Gói Cơ bản hoàn toàn miễn phí vĩnh viễn. Với gói Chuyên nghiệp và Doanh nghiệp, chúng tôi tặng 14 ngày dùng thử.',
                },
                {
                  q: 'Nếu tôi cần tính năng tùy chỉnh thì sao?',
                  a: 'Khách hàng Doanh nghiệp có thể yêu cầu tính năng và tích hợp tùy chỉnh. Liên hệ đội bán hàng để trao đổi cụ thể.',
                },
                {
                  q: 'Nếu tôi hủy gói thì sao?',
                  a: 'Bạn có thể hủy bất cứ lúc nào mà không bị phạt. Dữ liệu của bạn sẽ được lưu giữ trong 30 ngày sau khi hủy.',
                },
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">So sánh tính năng</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Tính năng</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Cơ bản</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Chuyên nghiệp</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Doanh nghiệp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: 'Tìm kiếm KOL', starter: true, pro: true, ent: true },
                    { feature: 'Đơn đặt đang hoạt động', starter: '1', pro: '10', ent: 'Không giới hạn' },
                    { feature: 'Mẫu hợp đồng', starter: false, pro: true, ent: true },
                    { feature: 'Phân tích nâng cao', starter: false, pro: true, ent: true },
                    { feature: 'Thành viên nhóm', starter: '1', pro: '5', ent: 'Không giới hạn' },
                    { feature: 'Truy cập API', starter: false, pro: false, ent: true },
                    { feature: 'Quản lý tài khoản riêng', starter: false, pro: false, ent: true },
                    { feature: 'Hỗ trợ ưu tiên', starter: false, pro: true, ent: true },
                  ].map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">−</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-900">{row.starter}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">−</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-900">{row.pro}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.ent === 'boolean' ? (
                          row.ent ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">−</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-900">{row.ent}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Bắt đầu đặt KOL ngay hôm nay</h2>
            <p className="text-xl text-blue-100 mb-8">
              Cùng hàng trăm thương hiệu đang hợp tác thành công với các KOL
            </p>
            <Link
              href="/discover"
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-8 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              Bắt đầu miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
