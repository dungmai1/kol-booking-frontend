'use client';

import { Header } from '@/components/header';
import { ArrowRight, Search, CheckCircle2, Users, Star, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
                  Kết nối với KOL hàng đầu
                </h1>
                <p className="text-xl text-cyan-50 mb-8 leading-relaxed max-w-lg">
                  Tìm kiếm, quản lý và đặt các nhà sáng tạo nội dung cùng KOL phù hợp cho chiến dịch của thương hiệu bạn. Khám phá các nhà sáng tạo tài năng trên mọi nền tảng.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/discover"
                    className="bg-white hover:bg-slate-50 text-cyan-600 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                  >
                    Khám phá KOL
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    Tìm hiểu thêm
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/30 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 hover:bg-white/30 rounded-xl p-6 text-center text-white transition-all">
                      <div className="text-4xl font-bold mb-2">500+</div>
                      <div className="text-sm font-medium">KOL sẵn sàng</div>
                    </div>
                    <div className="bg-white/20 hover:bg-white/30 rounded-xl p-6 text-center text-white transition-all">
                      <div className="text-4xl font-bold mb-2">1000+</div>
                      <div className="text-sm font-medium">Chiến dịch thành công</div>
                    </div>
                    <div className="bg-white/20 hover:bg-white/30 rounded-xl p-6 text-center text-white transition-all">
                      <div className="text-4xl font-bold mb-2">4.8★</div>
                      <div className="text-sm font-medium">Đánh giá trung bình</div>
                    </div>
                    <div className="bg-white/20 hover:bg-white/30 rounded-xl p-6 text-center text-white transition-all">
                      <div className="text-4xl font-bold mb-2">24/7</div>
                      <div className="text-sm font-medium">Hỗ trợ không ngừng</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-slate-900 mb-10">Tìm kiếm nhanh</h2>
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm KOL, danh mục..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-slate-50 transition-all"
                />
              </div>
              <Link
                href="/discover"
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              >
                Tìm kiếm
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Vì sao chọn KOL Hub?</h2>
            <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
              Mọi thứ bạn cần để tìm kiếm, quản lý và đặt KOL cho chiến dịch của mình
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Users className="w-8 h-8" />,
                  title: 'Mạng lưới rộng lớn',
                  description: 'Tiếp cận hơn 500 KOL đã xác minh trên mọi nền tảng và danh mục',
                },
                {
                  icon: <CheckCircle2 className="w-8 h-8" />,
                  title: 'Nhà sáng tạo đã xác minh',
                  description: 'Tất cả nhà sáng tạo đều được xác minh và có thành tích chiến dịch thành công',
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: 'Đánh giá & Nhận xét',
                  description: 'Phản hồi thực tế từ các thương hiệu đã hợp tác với KOL của chúng tôi',
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: 'Đặt lịch dễ dàng',
                  description: 'Quản lý hợp đồng đơn giản và xử lý thanh toán an toàn',
                },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Danh mục phổ biến</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Tìm KOL trong lĩnh vực của bạn
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                'Làm đẹp & Mỹ phẩm',
                'Thời trang & Phong cách',
                'Du lịch & Phiêu lưu',
                'Công nghệ & Thiết bị',
                'Ẩm thực & Nấu ăn',
                'Thể hình & Sức khỏe',
                'Gaming & Thể thao điện tử',
                'Nghệ thuật & Thủ công',
              ].map((category) => (
                <Link
                  key={category}
                  href={`/discover?category=${encodeURIComponent(category)}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 text-center transition-all"
                >
                  <p className="font-medium text-gray-900">{category}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Sẵn sàng khởi chạy chiến dịch?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Bắt đầu tìm kiếm những KOL hoàn hảo cho thương hiệu của bạn ngay hôm nay
            </p>
            <Link
              href="/discover"
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-8 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              Bắt đầu ngay
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold mb-4">Công ty</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Về chúng tôi</a></li>
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                  <li><a href="#" className="hover:text-white">Tuyển dụng</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Nền tảng</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Khám phá</a></li>
                  <li><a href="#" className="hover:text-white">Bảng giá</a></li>
                  <li><a href="#" className="hover:text-white">Bảng điều khiển</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Hỗ trợ</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Trung tâm trợ giúp</a></li>
                  <li><a href="#" className="hover:text-white">Liên hệ</a></li>
                  <li><a href="#" className="hover:text-white">Trạng thái</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Pháp lý</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Chính sách bảo mật</a></li>
                  <li><a href="#" className="hover:text-white">Điều khoản</a></li>
                  <li><a href="#" className="hover:text-white">Cookie</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-center">&copy; 2024 KOL Hub. Đã đăng ký bản quyền.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
