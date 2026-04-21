# KOL Hub - Complete Routes Reference

## 📍 All Available Routes

### Public Routes (No Authentication Required)

| Route | Page | Purpose | Component |
|-------|------|---------|-----------|
| `/` | Home | Platform overview and hero | `app/page.tsx` |
| `/discover` | Discover KOLs | Search and filter creators | `app/discover/page.tsx` |
| `/kol/[id]` | KOL Profile | Individual creator details | `app/kol/[id]/page.tsx` |
| `/bookings` | Manage Bookings | View all booking requests | `app/bookings/page.tsx` |
| `/reviews` | Reviews & Ratings | Community feedback | `app/reviews/page.tsx` |
| `/pricing` | Pricing Plans | Subscription information | `app/pricing/page.tsx` |
| `/dashboard` | Dashboard | Overview and statistics | `app/dashboard/page.tsx` |
| `/profile` | Profile Settings | Account management | `app/profile/page.tsx` |

---

## 🔗 Dynamic Routes

### KOL Profiles
**Route Pattern**: `/kol/[id]`

**Example URLs**:
- `/kol/kol_1` → Nguyễn Hương Giang (Beauty)
- `/kol/kol_2` → Tú Anh Blogger (Fashion)
- `/kol/kol_3` → Phạm Hương (Travel)
- `/kol/kol_4` → Trần Thanh Nam (Technology)
- `/kol/kol_5` → Lê Minh Phương (Food)
- `/kol/kol_6` → Vũ Thảo Nhi (Fitness)
- `/kol/kol_7` → Đặng Huy Phúc (Gaming)
- `/kol/kol_8` → Hoàng Thúy Vân (Arts)

---

## 🧭 Navigation Links

### From Home Page (`/`)
```
Home (/)
├─ Discover KOLs → /discover
├─ Learn More → /pricing
├─ Category Cards → /discover?category=[name]
├─ Quick Search → /discover
└─ Footer Links
   ├─ About Us (static)
   ├─ Blog (static)
   ├─ Careers (static)
   ├─ Discover → /discover
   ├─ Pricing → /pricing
   └─ Dashboard → /dashboard
```

### From Header (All Pages)
```
Header Navigation
├─ Logo → /
├─ KOL Hub → /
├─ Discover KOLs → /discover
├─ My Bookings → /bookings
├─ Dashboard → /dashboard
├─ Pricing → /pricing
├─ User Menu
│  ├─ My Profile → /profile
│  ├─ Dashboard → /dashboard
│  ├─ Settings → /profile
│  └─ Logout (future)
└─ Search Bar → /discover
```

---

## 📄 Page Details

### 1. Home Page (`/`)
**File**: `app/page.tsx`
**Components Used**:
- Header
- Hero Section
- Search Section
- Features Section
- Categories Section
- CTA Section
- Footer

**Navigation From**:
- Direct URL access
- Logo click (all pages)
- Header brand text (all pages)

**Navigation To**:
- `/discover` - Discover KOLs button
- `/pricing` - Learn More button
- `/discover?category=...` - Category cards
- All footer links

---

### 2. Discover KOLs Page (`/discover`)
**File**: `app/discover/page.tsx`
**Components Used**:
- Header
- Search & Filter Bar
- Filter Panel
- KOL Card Grid

**Features**:
- Real-time search
- Category filter
- Platform filter
- Rating filter
- Price filter
- Clear filters option

**Navigation From**:
- Home page
- Header navigation
- Search button
- Category cards with query param

**Navigation To**:
- `/kol/[id]` - View Profile buttons
- `/discover?category=...` - Category filter
- `/discover?platform=...` - Platform filter

---

### 3. KOL Profile Page (`/kol/[id]`)
**File**: `app/kol/[id]/page.tsx`
**Components Used**:
- Header
- Hero Profile Section
- About Section
- Details Section
- Reviews Section
- Booking Card (Sidebar)
- Booking Form Modal

**Dynamic Params**:
- `id` - KOL ID (kol_1 through kol_8)

**Features**:
- Profile image and verification badge
- Engagement metrics
- Booking form modal
- Message button
- Favorite button
- Review section

**Navigation From**:
- `/discover` - View Profile button
- Direct URL with KOL ID

**Navigation To**:
- Booking modal opens inline
- `/bookings` - After booking submission
- External links (portfolio)

---

### 4. Bookings Page (`/bookings`)
**File**: `app/bookings/page.tsx`
**Components Used**:
- Header
- Filter Buttons
- Booking Grid
- Booking Cards
- Details Modal

**Filter Options**:
- All Bookings
- Pending Status
- Accepted Status
- Completed Status

**Navigation From**:
- Header navigation
- Dashboard recent bookings
- KOL profile after booking

**Navigation To**:
- `/discover` - Discover KOLs (when empty)
- Booking details modal (inline)

---

### 5. Reviews Page (`/reviews`)
**File**: `app/reviews/page.tsx`
**Components Used**:
- Header
- Rating Summary (Sidebar)
- Rating Distribution
- Sort Options
- Review Cards

**Filter & Sort**:
- Filter by rating (1-5 stars)
- Sort by recent
- Sort by helpful
- Sort by highest rating

**Navigation From**:
- Header navigation
- Dashboard recent reviews
- Footer links

**Navigation To**:
- Self (filter updates)

---

### 6. Dashboard Page (`/dashboard`)
**File**: `app/dashboard/page.tsx`
**Components Used**:
- Header
- Stat Cards (4)
- Recent Bookings Table
- Recent Reviews Feed
- CTA Section

**Statistics Shown**:
- Total Bookings
- Total Budget
- KOLs Worked With
- Average Rating

**Navigation From**:
- Header navigation
- User menu
- Home CTA section
- Bookings page

**Navigation To**:
- `/bookings` - View all bookings
- `/reviews` - View all reviews
- `/discover` - Discover KOLs CTA
- `/kol/[id]` - From review previews (future)

---

### 7. Pricing Page (`/pricing`)
**File**: `app/pricing/page.tsx`
**Components Used**:
- Header
- Hero Section
- Pricing Cards (3)
- FAQ Section
- Feature Comparison Table
- CTA Section

**Pricing Tiers**:
- Starter (Free)
- Professional ($29/month)
- Enterprise (Custom)

**Navigation From**:
- Header navigation
- Home page Learn More
- Footer links

**Navigation To**:
- `/discover` - Get Started button
- FAQ section (self)
- Feature table (self)

---

### 8. Profile Settings Page (`/profile`)
**File**: `app/profile/page.tsx`
**Components Used**:
- Header
- Profile Picture Section
- Personal Info Form
- Company Info Form
- Save/Cancel Buttons
- Danger Zone

**Form Sections**:
- Profile picture upload
- Full name input
- Email input
- Phone input
- Country select
- Bio textarea
- Company name input
- Industry select
- Delete account button

**Navigation From**:
- Header user menu
- Dashboard settings link
- Direct URL access

**Navigation To**:
- Self (form submission)

---

## 🔍 Query Parameters

### Discover Page (`/discover`)
- `?category=[category_name]` - Filter by category
- `?platform=[platform_name]` - Filter by platform
- `?minRating=[0-5]` - Minimum rating filter
- `?maxPrice=[price]` - Maximum price filter
- `?search=[query]` - Search text

**Example URLs**:
- `/discover?category=Beauty%20%26%20Cosmetics`
- `/discover?platform=Instagram&minRating=4.5`
- `/discover?search=makeup&maxPrice=5000`

---

## 🎯 Route Accessibility

### Always Accessible
- `/` - Home
- `/discover` - Discovery
- `/kol/[id]` - Any KOL profile
- `/reviews` - Reviews
- `/pricing` - Pricing
- `/bookings` - Bookings (would be protected in real app)
- `/dashboard` - Dashboard (would be protected in real app)
- `/profile` - Profile (would be protected in real app)

### Currently Public (Future: Protected)
- `/bookings` - Would require auth
- `/dashboard` - Would require auth
- `/profile` - Would require auth

---

## 🚀 URL Structure

### Pages
- Lowercase with hyphens: `/discover`, `/my-bookings`
- Segment-based: `/kol/[id]`
- Flat structure: No deep nesting

### Query Parameters
- Category: `?category=Beauty%20%26%20Cosmetics`
- Platform: `?platform=Instagram`
- Rating: `?minRating=4.5`
- Price: `?maxPrice=5000`
- Search: `?search=term`

### Conventions
- Route names descriptive
- Dynamic segments in brackets: `[id]`
- Underscores in IDs: `kol_1`, `client_1`
- URL encoded special characters

---

## 📊 Route Hierarchy

```
/                               (Root - Home)
├── /discover                   (Search & Browse)
│   └── /kol/[id]             (Detail View)
├── /bookings                   (Booking Management)
├── /reviews                    (Community Feedback)
├── /dashboard                  (Statistics & Overview)
├── /pricing                    (Plans & Features)
└── /profile                    (Account Settings)
```

---

## 🔗 Internal Navigation Map

```
Home (/)
  ↓
  ├─→ Discover (/discover)
  │     ├─→ KOL Profile (/kol/[id])
  │     │     ├─→ Booking Modal
  │     │     └─→ Bookings (/bookings)
  │     └─→ Reviews (/reviews)
  │
  ├─→ Pricing (/pricing)
  │     └─→ Discover (/discover)
  │
  └─→ Dashboard (/dashboard)
        ├─→ Bookings (/bookings)
        └─→ Reviews (/reviews)

Header Available: Home, Discover, Bookings, Dashboard, Pricing, Profile
```

---

## 💡 Route Tips

1. **Bookmark Favorites**: You can save any route URL as a bookmark
2. **Share KOL Links**: Share `/kol/[id]` URLs with others
3. **Deep Links**: All routes support deep linking
4. **Back Navigation**: Browser back button works everywhere
5. **Direct Access**: All routes accessible via direct URL entry

---

## 🧪 Testing Routes

### Verify All Routes Work
```
1. Test / (home)
2. Test /discover (search)
3. Test /kol/kol_1 through /kol/kol_8 (profiles)
4. Test /bookings (bookings)
5. Test /reviews (reviews)
6. Test /dashboard (dashboard)
7. Test /pricing (pricing)
8. Test /profile (profile)
```

### Test Navigation
```
1. Click all header links
2. Click all card links
3. Click all buttons
4. Test category filter navigation
5. Test filter links
6. Test modal closes
7. Test back button
```

---

## 📱 Route Responsive Behavior

All routes are fully responsive:
- Mobile: Single column, stacked layouts
- Tablet: Two column grids
- Desktop: Three+ column grids
- Header: Hamburger menu on mobile
- Modal: Full-screen on mobile, centered overlay on desktop

---

**Last Updated**: April 2026
**Framework**: Next.js 16 (App Router)
**Status**: All routes functional and tested
