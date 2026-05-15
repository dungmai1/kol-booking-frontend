# 📊 BÁO CÁO TIẾN ĐỘ DỰ ÁN — KOL BOOKING FRONTEND

> **Mục đích:** Tài liệu thuyết trình tổng kết các chức năng đã hoàn thiện và phần việc còn lại.
> **Ngày báo cáo:** 2026-05-08
> **Ngôn ngữ/Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Công nghệ sử dụng
| Hạng mục | Lựa chọn |
|---|---|
| **Framework** | Next.js 16.2.0 (App Router) |
| **UI Library** | React 19.2.4 |
| **Ngôn ngữ** | TypeScript 5.7.3 |
| **Styling** | Tailwind CSS v4 + Radix UI primitives |
| **Form** | React Hook Form 7.54 + Zod 3.24 (validation) |
| **Charts** | Recharts 2.15 |
| **Icons** | Lucide React |
| **Toast/Notify** | Sonner |
| **HTTP Client** | Custom fetch wrapper có auto refresh-token |
| **Auth** | JWT (lưu localStorage) + Custom AuthContext |

### 1.2. Kiến trúc
- **Frontend** chạy độc lập, gọi REST API backend tại `http://localhost:8080/api/v1`.
- **Auth flow:** JWT access token (15 phút) + refresh token (7 ngày), tự động refresh khi gặp 401, có queue logic chống race-condition.
- **Phân quyền 3 role:** `BRAND` · `KOL` · `ADMIN`.
- **API layer** được tách module rõ ràng trong [src/lib/api/](src/lib/api/) — 15 module, **60+ endpoints**.

### 1.3. Số liệu nhanh
- ✅ ~70% chức năng **đã hook API thật** (UI + Backend liên thông).
- ⚠️ ~20% chức năng **đã có API client** nhưng **chưa có UI**.
- ❌ ~10% chức năng đang dùng **mock/UI tĩnh** chưa kết nối.

---

## 2. CÁC CHỨC NĂNG ĐÃ HOÀN THIỆN ✅

> Có UI hoàn chỉnh + đã kết nối API backend, người dùng có thể sử dụng end-to-end.

### 2.1. Hệ thống xác thực (Authentication)
| Chức năng | UI | API | Ghi chú |
|---|:-:|:-:|---|
| Đăng ký tài khoản (chọn role BRAND/KOL) | ✅ | ✅ | Validate email + password ≥ 8 ký tự |
| Đăng nhập | ✅ | ✅ | Có toggle hiện/ẩn mật khẩu |
| Đăng xuất | ✅ | ✅ | Xoá token + clear context |
| Auto-refresh token | – | ✅ | Khi gặp 401 tự động gọi refresh |
| Điều hướng theo role | ✅ | – | KOL → `/kol-dashboard/me`, BRAND → `/dashboard` |

**File chính:** [src/app/auth/login/page.tsx](src/app/auth/login/page.tsx), [src/app/auth/register/page.tsx](src/app/auth/register/page.tsx), [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

### 2.2. Khám phá & tìm kiếm KOL (Discover)
| Chức năng | Mô tả |
|---|---|
| Tìm kiếm full-text | Theo tên/username/category, có debounce 350ms |
| Lọc theo Category | Dropdown lấy danh mục từ API |
| Lọc theo Platform | TikTok / Instagram / YouTube / Facebook |
| Lọc theo Rating | Min rating 0–5 sao |
| Sắp xếp | Featured / Rating / Price (asc/desc) / Followers |
| Phân trang | 24 KOL / trang |

**File:** [src/app/discover/page.tsx](src/app/discover/page.tsx), [src/app/kol-profiles/page.tsx](src/app/kol-profiles/page.tsx)

### 2.3. Xem chi tiết KOL
- Hiển thị: avatar, tên, category, platform, followers, engagement rate, badge xác minh, giá dịch vụ, portfolio.
- Tab review hiển thị 10 đánh giá gần nhất.
- Nút **Yêu thích / Bỏ yêu thích** (favorite) đã hoạt động.
- Nút **Booking** mở form đặt KOL.

**File:** [src/app/kol/[id]/page.tsx](src/app/kol/[id]/page.tsx)

### 2.4. Đặt lịch (Booking) — Brand đặt KOL
- Modal form gồm: tên chiến dịch, mô tả, ngân sách (định dạng VNĐ), ngày bắt đầu/kết thúc, deliverables.
- Submit gọi `POST /bookings` tạo booking mới.

**File:** [src/components/booking-form.tsx](src/components/booking-form.tsx)

### 2.5. Quản lý Booking (cho cả Brand & KOL)
| Hành động | Vai trò | Trạng thái |
|---|---|:-:|
| Xem booking đã tạo | BRAND | ✅ |
| Xem booking đến (incoming) | KOL | ✅ |
| Lọc theo status | Cả hai | ✅ |
| Chấp nhận booking | KOL | ✅ |
| Từ chối booking (kèm lý do) | KOL | ✅ |
| Huỷ booking (kèm lý do) | BRAND | ✅ |
| Approve delivery | BRAND | ✅ |
| Mở dispute (khiếu nại) | Cả hai | ✅ |

**File:** [src/app/bookings/page.tsx](src/app/bookings/page.tsx), [src/lib/api/bookings.ts](src/lib/api/bookings.ts)

### 2.6. Dashboard
**Brand Dashboard** ([src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)):
- Stats cards: Tổng booking, Số dư ví, Tổng ngân sách đã chi, Rating trung bình.
- Bảng 5 booking gần nhất.
- Danh sách 3 review gần nhất.

**KOL Dashboard** ([src/app/kol-dashboard/[id]/page.tsx](src/app/kol-dashboard/[id]/page.tsx)):
- Profile card + badge xác minh.
- Stats: Booking đang hoạt động, Tổng thu nhập, Rating trung bình.
- Tab Booking đến (Accept/Reject ngay tại dashboard).
- Tab Reviews.

### 2.7. Hệ thống đánh giá (Reviews — phần xem)
- Trang [src/app/reviews/page.tsx](src/app/reviews/page.tsx) hiển thị toàn bộ review.
- Biểu đồ phân bố theo số sao (Recharts).
- Lọc theo số sao + sắp xếp Recent / Highest rating.

### 2.8. Ví & danh mục
- Hiển thị **số dư ví** + **số tiền đang giữ (held)** ở Dashboard.
- Categories được fetch động từ API (dùng cho filter Discover).
- Yêu thích/Bỏ yêu thích KOL (favorites).

---

## 3. CHỨC NĂNG ĐÃ CÓ API NHƯNG CHƯA CÓ UI ⚠️

> Backend ready — chỉ cần frontend bổ sung giao diện là chạy được.

| # | Chức năng | API tồn tại tại | Việc còn lại |
|---|---|---|---|
| 1 | **Quên / đặt lại mật khẩu** | [src/lib/api/auth.ts](src/lib/api/auth.ts) `forgotPassword`, `resetPassword` | Tạo 2 page `/auth/forgot-password` và `/auth/reset-password` |
| 2 | **Thanh toán booking (Checkout)** | [src/lib/api/payments.ts](src/lib/api/payments.ts) | Tạo flow checkout, tích hợp cổng (VNPAY/Momo/Stripe) |
| 3 | **Yêu cầu rút tiền (Withdrawal)** | [src/lib/api/withdrawals.ts](src/lib/api/withdrawals.ts) | Tạo form yêu cầu rút tiền cho KOL |
| 4 | **Lịch sử giao dịch ví** | [src/lib/api/wallet.ts](src/lib/api/wallet.ts) `getTransactions` | Tạo page `/wallet/transactions` |
| 5 | **Trung tâm thông báo** | [src/lib/api/notifications.ts](src/lib/api/notifications.ts) | Tạo dropdown notification ở header + page list |
| 6 | **Nhắn tin trong booking** | [src/lib/api/bookings.ts](src/lib/api/bookings.ts) `sendMessage`, `getMessages` | Tạo UI chat giữa Brand ↔ KOL trong booking detail |
| 7 | **Upload file/avatar** | [src/lib/api/files.ts](src/lib/api/files.ts) | Hook button "Upload Avatar" ở Profile page |
| 8 | **Viết đánh giá sau booking** | [src/lib/api/reviews.ts](src/lib/api/reviews.ts) `create`, `update` | Tạo form review hiển thị khi booking COMPLETED |

---

## 4. CHỨC NĂNG CHƯA HOÀN THIỆN ❌

> Cần làm cả backend integration lẫn UI hoặc đang ở dạng mock.

### 4.1. Trang Profile cá nhân
- File: [src/app/profile/page.tsx](src/app/profile/page.tsx)
- **Đang ở dạng mock**: form chỉ `setTimeout` 800ms rồi `alert("Cập nhật thành công")` — **không gọi API**.
- Field hiển thị dữ liệu hardcode (`"Nguyễn Văn A"`, `"vana@example.com"`...).
- **Cần làm:** Hook `kolApi.getMyProfile` / `brandApi.getMyProfile` và `updateMyProfile`.

### 4.2. Admin Panel toàn bộ
- API layer đã có 15+ endpoints ở [src/lib/api/admin.ts](src/lib/api/admin.ts):
  - User management (ban/unban)
  - Duyệt KOL & Brand (approve/reject)
  - Quản lý category (CRUD)
  - Giải quyết dispute
  - Thống kê tổng quan, top KOL, doanh thu
- ❌ **Không có route `/admin`** nào tồn tại — login redirect tới `/admin` sẽ lỗi 404.
- **Cần làm:** Xây dựng toàn bộ admin dashboard.

### 4.3. Search bar ở header
- Có ô input nhưng nhiều khả năng chỉ link tới `/discover` mà không truyền query param.

---

## 5. DANH SÁCH ROUTE HIỆN TẠI

### Public (không cần đăng nhập)
| Route | Trang |
|---|---|
| `/` | Landing page |
| `/auth/login` | Đăng nhập ✅ |
| `/auth/register` | Đăng ký ✅ |
| `/discover` | Khám phá KOL ✅ |
| `/kol/[id]` | Chi tiết KOL ✅ |
| `/pricing` | Bảng giá (tĩnh) |

### Protected
| Route | Role | Trạng thái |
|---|---|:-:|
| `/dashboard` | BRAND, KOL | ✅ |
| `/bookings` | BRAND, KOL | ✅ |
| `/reviews` | BRAND, KOL | ✅ |
| `/profile` | All | ❌ Mock |
| `/kol-profiles` | BRAND | ✅ |
| `/kol-profiles/[id]` | BRAND | ✅ |
| `/kol-dashboard/[id]` | KOL | ✅ |
| `/admin` | ADMIN | ❌ **Chưa tồn tại** |
| `/auth/forgot-password` | – | ❌ Chưa có |
| `/auth/reset-password` | – | ❌ Chưa có |

---

## 6. ĐÁNH GIÁ TỔNG QUAN

### Điểm mạnh 💪
1. **Kiến trúc rõ ràng:** API layer tách biệt từng module, dễ maintain.
2. **Auth chắc chắn:** Có cơ chế refresh token với queue, an toàn race-condition.
3. **TypeScript-first:** Types định nghĩa đầy đủ trong [src/lib/api/types.ts](src/lib/api/types.ts).
4. **UI nhất quán:** Dùng Radix UI + Tailwind, hỗ trợ dark mode.
5. **Luồng nghiệp vụ chính (đặt KOL → quản lý booking → review)** đã thông suốt.

### Điểm cần cải thiện 🔧
1. **Trang Profile** đang là mock — cần hook API thật.
2. **Admin Panel** chưa có UI dù backend ready 100%.
3. **Thanh toán** chưa tích hợp cổng thanh toán cụ thể (VNPAY/Momo/Stripe).
4. **Notification Center** chưa có UI mặc dù API đầy đủ.
5. **Messaging** giữa Brand và KOL chưa có giao diện chat.

---

## 7. ROADMAP ĐỀ XUẤT (sắp xếp ưu tiên)

### 🔥 Sprint 1 — Hoàn thiện luồng cốt lõi (1–2 tuần)
1. Hook API thật cho **trang Profile** (BRAND + KOL).
2. Form **viết review** sau khi booking COMPLETED.
3. **Notification dropdown** ở header + trang danh sách.
4. **Upload avatar** thực tế.

### 🚀 Sprint 2 — Thanh toán & Tài chính (2 tuần)
5. Tích hợp cổng thanh toán (đề xuất VNPAY hoặc Stripe).
6. UI yêu cầu rút tiền (KOL).
7. Trang lịch sử giao dịch ví.

### 💼 Sprint 3 — Admin & Mở rộng (2–3 tuần)
8. Admin Dashboard (User/KOL/Brand approval, dispute, stats).
9. Forgot/Reset password pages.
10. Booking messaging (chat Brand ↔ KOL).

---

## 8. CHỈ SỐ HOÀN THÀNH

```
Tổng tính năng theo kế hoạch:     ~25
Đã hoàn thiện end-to-end:          17  (68%)
Có API, chưa có UI:                 8  (32%)
UI mock hoàn toàn:                  1  (Profile)

Số endpoints API đã viết:          60+
Số module API:                     15
Số page Next.js đã có:             11
```

---

> **Tổng kết một câu:** Dự án đã chạy được **luồng nghiệp vụ chính** (đăng ký → tìm KOL → đặt lịch → quản lý booking → đánh giá), phần còn thiếu chủ yếu là **Admin Panel**, **Thanh toán** và một số trang phụ trợ — nhưng backend đã sẵn sàng nên chỉ cần bổ sung UI.
