'use client';

import { Header } from '@/components/header';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Home — adapted from the Pinterest marketing chrome documented in DESIGN.md.
 *
 * Layout rhythm (top → bottom):
 *   1. Hero with display-xl headline + brand-red CTA + pin-board preview
 *   2. Category tile section ("Bring your favorite ideas to life")
 *   3. Alternating feature cards (text-left/image-right, then mirrored)
 *   4. Dark hero-cta-strip on `surface-dark`
 *   5. 4-column footer with hairline top rule
 *
 * Section gap is `spacing.section` (64px). Pinterest Red is reserved
 * exclusively for the primary CTA and the brand wordmark.
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main className="bg-surface-soft text-body">
        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-12 md:pt-20 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Headline column */}
              <div className="lg:col-span-6">
                <p className="text-pin-red font-bold text-sm uppercase tracking-[0.2em] mb-6">
                  Khám phá KOL · Đặt chiến dịch
                </p>
                <h1 className="font-display font-extrabold text-ink leading-[1.05] text-[44px] sm:text-[56px] lg:text-[70px] tracking-[-1.2px]">
                  Tìm KOL
                  <br />
                  cho thương hiệu
                  <br />
                  bạn yêu thích
                </h1>
                <p className="mt-6 text-body text-base lg:text-lg max-w-[480px] leading-relaxed">
                  Mạng lưới hơn 500 nhà sáng tạo nội dung đã xác minh trên TikTok, Instagram, YouTube và Facebook — tất cả trong một bảng tin.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/discover" className="btn-pin-primary !rounded-full !px-6 !py-3 text-sm">
                    Bắt đầu khám phá
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Pin board preview — six tiles in a balanced 3-column mosaic */}
              <div className="lg:col-span-6">
                <PinBoardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ============== "Bring your favorite ideas to life" ============== */}
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-16 md:py-20">
          <h2 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px] mb-10 max-w-3xl">
            Mọi danh mục đều có những gương mặt nổi bật
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <CategoryTile key={cat.label} {...cat} />
            ))}
          </div>
        </section>

        {/* ===================== ALTERNATING FEATURE CARDS ===================== */}
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-16">
          <FeatureCard
            eyebrow="Cho thương hiệu"
            heading="Đặt chiến dịch chỉ trong vài cú click"
            body="Lọc theo nền tảng, thể loại, lượng follower và mức ngân sách. So sánh nhanh các KOL bằng masonry grid đầy hình ảnh — bạn nhìn thấy chiến dịch trước khi ký hợp đồng."
            cta={{ href: '/discover', label: 'Khám phá KOL' }}
            image="left"
            tilePalette={['#f6e0d6', '#e9d5c6', '#dec0a3']}
            pillLabel="Cherry red"
            tileImages={[
              unsplash('1596462502278-27bfdc403348', 700, 900),
              unsplash('1531746020798-e6953c6e8e04', 500, 500),
              unsplash('1571781926291-c477ebfd024b', 500, 500),
            ]}
          />

          <FeatureCard
            eyebrow="Cho nhà sáng tạo"
            heading="Để hồ sơ của bạn được đặt trước"
            body="Nhận đơn đặt phù hợp với phong cách sáng tạo của bạn. Quản lý hợp đồng, deliverables và thanh toán an toàn — tất cả trong một bảng điều khiển dành riêng cho KOL."
            cta={{ href: '/kol-profiles', label: 'Mở hồ sơ KOL' }}
            image="right"
            tilePalette={['#dde6df', '#c8d6cc', '#a3b9ac']}
            pillLabel="Editorial vibe"
            tileImages={[
              unsplash('1524504388940-b1c1722653e1', 700, 900),
              unsplash('1438761681033-6461ffad8d80', 500, 500),
              unsplash('1492447166138-50c3889fccb1', 500, 500),
            ]}
          />

          <FeatureCard
            eyebrow="Đánh giá thật, kết quả thật"
            heading="500+ chiến dịch đã hoàn thành — và mọi feedback đều ở đây"
            body="Mỗi đơn đặt được đánh giá cả hai chiều: thương hiệu chấm KOL, KOL chấm thương hiệu. Bạn đặt một KOL và biết rõ trước rằng họ giao đúng hạn, đúng concept."
            cta={{ href: '/reviews', label: 'Đọc nhận xét' }}
            image="left"
            tilePalette={['#efe1f2', '#dfc3e2', '#c69bcb']}
            pillLabel="5.0 stars"
            tileImages={[
              unsplash('1494790108377-be9c29b29330', 700, 900),
              unsplash('1517673132405-a56a62b18caf', 500, 500),
              unsplash('1469041797191-50ace28483c3', 500, 500),
            ]}
          />
        </section>

        {/* ============== DARK CTA STRIP (hero-cta-strip) ============== */}
        <section className="bg-surface-dark text-on-dark">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 md:py-14 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
              <h3 className="font-display font-bold text-on-dark text-[24px] md:text-[28px] tracking-[-0.6px]">
                Sẵn sàng đặt KOL đầu tiên?
              </h3>
              <p className="mt-2 text-stone text-sm md:text-base max-w-2xl">
                Tài khoản miễn phí, không thẻ tín dụng. Bắt đầu trong vòng 60 giây.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <Link href="/auth/register" className="btn-pin-primary !rounded-full !px-6 !py-3 text-sm">
                Tạo tài khoản miễn phí
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ================================ FOOTER ================================ */}
        <PinterestFooter />
      </main>
    </>
  );
}

/* ─────────────────────────── Hero pin-board preview ─────────────────────────── */
function PinBoardPreview() {
  // Six pin-card-large tiles arranged into a balanced 3-column staggered layout.
  // Editorial Unsplash photography in Pinterest's warm-cream/peach palette so
  // the board reads as actual pin imagery — closer to a real demo for clients.
  // Gradient stays as a fallback while the photo loads.
  const tiles: Array<{ ratio: string; bg: string; img: string; alt: string; pill?: string }> = [
    {
      ratio: 'aspect-[3/4]',
      bg: 'linear-gradient(160deg, #f6dccb 0%, #d8a785 100%)',
      img: unsplash('1487412947147-5cebf100ffc2', 600, 800),
      alt: 'Beauty close-up',
      pill: 'Beauty',
    },
    {
      ratio: 'aspect-[1/1]',
      bg: 'linear-gradient(140deg, #efe1d4 0%, #c8a98a 100%)',
      img: unsplash('1504674900247-0877df9cc836', 600, 600),
      alt: 'Editorial food',
    },
    {
      ratio: 'aspect-[4/5]',
      bg: 'linear-gradient(150deg, #e9d5e6 0%, #b287b3 100%)',
      img: unsplash('1483985988355-763728e1935b', 600, 750),
      alt: 'Fashion editorial',
      pill: 'Fashion',
    },
    {
      ratio: 'aspect-[2/3]',
      bg: 'linear-gradient(160deg, #d6e3dd 0%, #82a193 100%)',
      img: unsplash('1469041797191-50ace28483c3', 600, 900),
      alt: 'Lifestyle portrait',
    },
    {
      ratio: 'aspect-[3/4]',
      bg: 'linear-gradient(150deg, #f1d9c6 0%, #c5825a 100%)',
      img: unsplash('1488646953014-85cb44e25828', 600, 800),
      alt: 'Travel atmosphere',
      pill: 'Travel',
    },
    {
      ratio: 'aspect-[1/1]',
      bg: 'linear-gradient(140deg, #e3dccd 0%, #a59b80 100%)',
      img: unsplash('1517673132405-a56a62b18caf', 600, 600),
      alt: 'Studio composition',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" style={{ gridAutoFlow: 'dense' }}>
      {tiles.map((t, i) => (
        <div
          key={i}
          className={`relative rounded-[2rem] overflow-hidden ${t.ratio}`}
          style={{ background: t.bg, gridRow: i === 0 ? 'span 2' : 'auto' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.img}
            alt={t.alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {t.pill && <span className="pin-overlay-pill top-3 left-3">{t.pill}</span>}
        </div>
      ))}
    </div>
  );
}

/* Unsplash CDN helper — `images.unsplash.com/photo-{id}` is the public CDN.
   `auto=format` lets the CDN serve AVIF/WebP, `fit=crop` crops to the requested
   aspect, `q=75` keeps the payload small enough for a marketing fold. */
function unsplash(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=75`;
}

/* ─────────────────────────────── Category tile ─────────────────────────────── */
const CATEGORIES: Array<{ id: number; label: string; bg: string; pill: string; img: string; alt: string }> = [
  {
    id: 1,
    label: 'Beauty',
    bg: 'linear-gradient(150deg, #f6dccb 0%, #c47a55 100%)',
    img: unsplash('1522335789203-aabd1fc54bc9', 600, 600),
    alt: 'Beauty makeup model',
    pill: 'Beauty',
  },
  {
    id: 2,
    label: 'Fashion',
    bg: 'linear-gradient(150deg, #e9d5e6 0%, #8a5e8e 100%)',
    img: unsplash('1539109136881-3be0616acf4b', 600, 600),
    alt: 'Fashion style outfit',
    pill: 'Fashion',
  },
  {
    id: 3,
    label: 'Tech',
    bg: 'linear-gradient(150deg, #d8e1ee 0%, #4a5d7e 100%)',
    img: unsplash('1488590528505-98d2b5aba04b', 600, 600),
    alt: 'Tech laptop and devices',
    pill: 'Tech',
  },
  {
    id: 4,
    label: 'Food',
    bg: 'linear-gradient(150deg, #f0d0b1 0%, #a05a2c 100%)',
    img: unsplash('1504674900247-0877df9cc836', 600, 600),
    alt: 'Food spread dishes',
    pill: 'Food',
  },
  {
    id: 5,
    label: 'Lifestyle',
    bg: 'linear-gradient(150deg, #fde8d8 0%, #d4845a 100%)',
    img: unsplash('1506126613408-eca07ce68773', 600, 600),
    alt: 'Lifestyle morning routine',
    pill: 'Lifestyle',
  },
  {
    id: 6,
    label: 'Travel',
    bg: 'linear-gradient(150deg, #c8dcd6 0%, #4f7a72 100%)',
    img: unsplash('1476514525535-07fb3b4ae5f1', 600, 600),
    alt: 'Travel scenic landscape',
    pill: 'Travel',
  },
  {
    id: 7,
    label: 'Fitness',
    bg: 'linear-gradient(150deg, #ddebd5 0%, #5b7d3f 100%)',
    img: unsplash('1526506118085-60ce8714f8c5', 600, 600),
    alt: 'Fitness running workout',
    pill: 'Fitness',
  },
  {
    id: 12,
    label: 'Entertainment',
    bg: 'linear-gradient(150deg, #d8c9eb 0%, #5a3f8e 100%)',
    img: unsplash('1514320291840-2e0a9bf2a9ae', 600, 600),
    alt: 'Entertainment music concert',
    pill: 'Entertainment',
  },
];

function CategoryTile({ id, label, bg, pill, img, alt }: { id: number; label: string; bg: string; pill: string; img: string; alt: string }) {
  return (
    <Link
      href={`/discover?categoryId=${id}`}
      className="group block"
    >
      <div
        className="relative aspect-square rounded-md overflow-hidden"
        style={{ background: bg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Soft top gradient so the white pill always reads against the photo */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
        <span className="pin-overlay-pill top-3 left-3">{pill}</span>
      </div>
      <p className="mt-2 px-1 text-sm font-bold text-ink truncate">{label}</p>
    </Link>
  );
}

/* ─────────────────────────────── Feature card ─────────────────────────────── */
function FeatureCard({
  eyebrow,
  heading,
  body,
  cta,
  image,
  tilePalette,
  pillLabel,
  tileImages,
}: {
  eyebrow: string;
  heading: string;
  body: string;
  cta: { href: string; label: string };
  image: 'left' | 'right';
  tilePalette: [string, string, string];
  pillLabel: string;
  tileImages: [string, string, string];
}) {
  const ImageBlock = (
    <div className="lg:col-span-7">
      <div className="grid grid-cols-3 gap-2">
        <div
          className="relative aspect-[3/4] rounded-md overflow-hidden col-span-2 row-span-2"
          style={{ background: `linear-gradient(150deg, ${tilePalette[0]} 0%, ${tilePalette[2]} 100%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tileImages[0]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <span className="pin-overlay-pill bottom-3 left-3">{pillLabel}</span>
        </div>
        <div
          className="relative aspect-square rounded-md overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${tilePalette[1]} 0%, ${tilePalette[0]} 100%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tileImages[1]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div
          className="relative aspect-square rounded-md overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${tilePalette[2]} 0%, ${tilePalette[1]} 100%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tileImages[2]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );

  const TextBlock = (
    <div className="lg:col-span-5">
      <p className="text-pin-red font-bold text-xs uppercase tracking-[0.2em] mb-4">
        {eyebrow}
      </p>
      <h3 className="font-display font-bold text-ink text-[28px] lg:text-[32px] tracking-[-0.8px] leading-[1.15] mb-4">
        {heading}
      </h3>
      <p className="text-body text-[15px] leading-relaxed mb-6 max-w-md">
        {body}
      </p>
      <Link href={cta.href} className="btn-pin-primary !rounded-full !px-5 !py-3 text-sm">
        {cta.label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-16 lg:mb-24 last:mb-0">
      {image === 'left' ? (
        <>
          {ImageBlock}
          {TextBlock}
        </>
      ) : (
        <>
          {TextBlock}
          {ImageBlock}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────── Footer ─────────────────────────────── */
function PinterestFooter() {
  return (
    <footer className="bg-canvas border-t border-hairline">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-sm font-bold text-ink mb-4">Tải ứng dụng</h4>
            <ul className="space-y-2 text-sm text-mute">
              <li><a href="#" className="hover:text-ink">iOS</a></li>
              <li><a href="#" className="hover:text-ink">Android</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm text-mute">
              <li><Link href="/discover" className="hover:text-ink">Khám phá</Link></li>
              <li><Link href="/kol-profiles" className="hover:text-ink">Hồ sơ KOL</Link></li>
              <li><Link href="/reviews" className="hover:text-ink">Đánh giá</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink mb-4">Dành cho</h4>
            <ul className="space-y-2 text-sm text-mute">
              <li><a href="#" className="hover:text-ink">Thương hiệu</a></li>
              <li><a href="#" className="hover:text-ink">Nhà sáng tạo</a></li>
              <li><a href="#" className="hover:text-ink">Agency</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink mb-4">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm text-mute">
              <li><a href="#" className="hover:text-ink">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-ink">Điều khoản</a></li>
              <li><a href="#" className="hover:text-ink">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-ink">Liên hệ</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-hairline-soft flex flex-wrap items-center justify-between gap-4">
          <span className="font-display font-extrabold text-pin-red text-lg tracking-tight">
            KOL Hub
          </span>
          <p className="text-xs text-mute">© 2026 KOL Hub. Đã đăng ký bản quyền.</p>
        </div>
      </div>
    </footer>
  );
}
