'use client';

import { Header } from '@/components/header';
import { Save } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'vana@example.com',
    phone: '+84 123 456 789',
    country: 'Việt Nam',
    bio: 'Quản lý thương hiệu tập trung vào các chiến dịch marketing số.',
    company: 'Công ty Brand Marketing',
    industry: 'Thương mại điện tử',
  });
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => { setIsSaving(false); alert('Cập nhật hồ sơ thành công!'); }, 800);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-6">
          <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">Hồ sơ của tôi</h1>
          <p className="text-mute mt-2">Quản lý thông tin tài khoản của bạn.</p>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <section className="bg-canvas rounded-md border border-hairline p-8">
              <h2 className="font-display font-bold text-ink text-[18px] mb-6">Ảnh đại diện</h2>
              <div className="flex items-center gap-6">
                <div className="grid place-items-center w-24 h-24 rounded-full bg-ink text-on-dark font-display font-extrabold text-4xl">
                  NA
                </div>
                <div>
                  <button type="button" className="btn-pin-primary !rounded-full">Tải ảnh lên</button>
                  <p className="text-xs text-mute mt-2">JPG, PNG hoặc GIF (tối đa 5MB)</p>
                </div>
              </div>
            </section>

            {/* Personal info */}
            <section className="bg-canvas rounded-md border border-hairline p-8">
              <h2 className="font-display font-bold text-ink text-[18px] mb-6">Thông tin cá nhân</h2>
              <div className="space-y-5">
                <Field label="Họ và tên">
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="pin-input" />
                </Field>
                <Field label="Email">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="pin-input" />
                </Field>
                <Field label="Số điện thoại">
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="pin-input" />
                </Field>
                <Field label="Quốc gia">
                  <select name="country" value={formData.country} onChange={handleChange} className="pin-input">
                    <option>Việt Nam</option><option>Thái Lan</option><option>Indonesia</option>
                    <option>Philippines</option><option>Singapore</option><option>Malaysia</option>
                  </select>
                </Field>
                <Field label="Giới thiệu">
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="pin-input" />
                </Field>
              </div>
            </section>

            {/* Company info */}
            <section className="bg-canvas rounded-md border border-hairline p-8">
              <h2 className="font-display font-bold text-ink text-[18px] mb-6">Thông tin công ty</h2>
              <div className="space-y-5">
                <Field label="Tên công ty">
                  <input type="text" name="company" value={formData.company} onChange={handleChange} className="pin-input" />
                </Field>
                <Field label="Ngành nghề">
                  <select name="industry" value={formData.industry} onChange={handleChange} className="pin-input">
                    <option>Thương mại điện tử</option><option>Thời trang</option><option>Làm đẹp</option>
                    <option>Thực phẩm & Đồ uống</option><option>Công nghệ</option><option>Khác</option>
                  </select>
                </Field>
              </div>
            </section>

            <div className="flex gap-3">
              <button type="submit" disabled={isSaving} className="btn-pin-primary !rounded-full flex-1 !py-3">
                <Save className="w-4 h-4" />
                {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
              <button type="button" className="btn-pin-secondary !rounded-full flex-1 !py-3">Hủy</button>
            </div>
          </form>

          {/* Danger zone */}
          <section className="mt-6 bg-canvas rounded-md border border-hairline p-8">
            <h3 className="font-display font-bold text-ink text-[18px] mb-2">Vùng nguy hiểm</h3>
            <p className="text-mute text-sm mb-5">Các hành động này không thể khôi phục — hãy cân nhắc kỹ trước khi tiếp tục.</p>
            <button className="inline-flex items-center justify-center gap-2 bg-pin-red text-on-dark font-bold rounded-full px-5 py-2.5 text-sm hover:bg-pin-red-pressed transition-colors">
              Xóa tài khoản
            </button>
          </section>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-2">{label}</label>
      {children}
    </div>
  );
}
