# KOL Hub - Site Navigation Guide

Welcome to KOL Hub! This guide will help you navigate through all available pages and features.

## 🏠 Public Pages (No Login Required)

### Home Page (`/`)
**Entry point for the platform**
- Platform overview and value proposition
- Hero section with call-to-action
- Feature highlights (Huge Network, Verified Creators, Ratings & Reviews, Easy Booking)
- Quick search bar
- Popular categories browsing
- Footer with company links

**Key Actions:**
- "Discover KOLs" → Goes to `/discover`
- "Learn More" → Goes to `/pricing`
- Category cards → Filters discovery page by category

---

### Discover KOLs (`/discover`)
**Main KOL search and discovery page**
- Browse all 8 mock KOLs
- Advanced filtering system
- Real-time search functionality
- Grid view of KOL cards with key information

**Filters Available:**
- **Search**: By name, username, or bio
- **Category**: Beauty, Fashion, Travel, Tech, Food, Fitness, Gaming, Arts, etc.
- **Platform**: Instagram, TikTok, YouTube, Twitch
- **Rating**: Min 0-5 stars
- **Price**: Max $1,000-$20,000 monthly rate

**KOL Card Shows:**
- Avatar image
- Name and username
- Category and platform
- Followers count
- Engagement rate
- Star rating and review count
- Hourly and monthly pricing
- Verification badge

**Key Actions:**
- "View Profile" → Goes to `/kol/[id]`
- Click anywhere on card → Links to KOL profile

---

### KOL Profile (`/kol/[id]`)
**Detailed creator information page**
- Complete KOL profile with all information
- Hero section with profile image
- Engagement metrics and statistics
- Full biography
- Detailed information grid
- Reviews and feedback section
- Booking and messaging options

**Sections:**
1. **Hero**: Large avatar, verification badge, quick stats
2. **About**: Bio, portfolio link
3. **Details**: Platform, category, follower count, engagement rate, status
4. **Reviews**: Community feedback with ratings and comments
5. **Booking Card** (right sidebar):
   - Hourly rate
   - Monthly rate
   - "Book Now" button → Opens booking modal
   - "Message" button
   - Guarantee badge
   - Rating summary

**Key Actions:**
- "Book Now" → Opens booking form modal
- Portfolio link → External website
- Reviews → Scroll to view all feedback
- Heart icon → Add to favorites (local state)

**Booking Modal:**
- Campaign name
- Campaign description
- Start and end dates
- Budget input (with suggested rates)
- Deliverables list (textarea)
- Submit to create booking request

---

### Bookings (`/bookings`)
**Manage all KOL booking requests**
- View all bookings or filter by status
- Booking status tracking
- Detailed booking information
- Campaign timeline

**Filter Options:**
- **All**: Show all bookings
- **Pending**: Awaiting KOL response
- **Accepted**: Confirmed by KOL
- **Completed**: Campaign finished

**Booking Card Shows:**
- Campaign name and KOL name
- Status badge with color coding
- Campaign dates
- Budget amount
- Campaign description (truncated)
- Deliverables list
- Action buttons (Details, Accept/Decline for pending)

**Key Actions:**
- "Details" → Open modal with full booking information
- "Accept" (pending only) → Accept booking
- "Decline" (pending only) → Reject booking
- "Discover KOLs" → Link to discovery page when no bookings

---

### Reviews (`/reviews`)
**Community feedback and ratings**
- All reviews from completed campaigns
- Rating distribution and statistics
- Sort and filter options
- Individual review cards

**Left Sidebar (Stats):**
- Average rating with star display
- Rating distribution with percentages
- 5 rating levels with counts
- Click rating to filter reviews

**Sort Options:**
- Most Recent (default)
- Most Helpful
- Highest Rating

**Review Cards Show:**
- Reviewer avatar
- Reviewer name
- Star rating
- Review date
- Review comment
- "Helpful" voting button

**Key Actions:**
- Select rating to filter → Shows only that rating
- "Clear filter" → Reset filter
- "Helpful" button → Vote review as helpful

---

### Pricing (`/pricing`)
**Subscription plans and pricing information**

**Three Plans:**
1. **Starter** ($0 forever)
   - Free tier with basic features
   - Browse profiles, search, view reviews
   - 1 active booking at a time

2. **Professional** ($29/month) ⭐ Most Popular
   - Recommended for growing brands
   - 10 active bookings
   - Advanced filters
   - Analytics and reports
   - Priority support

3. **Enterprise** (Custom)
   - For agencies and large teams
   - Unlimited bookings
   - Team management
   - API access
   - Dedicated account manager

**Page Sections:**
1. **Pricing Cards**: Interactive cards with features list
2. **FAQ**: Answers to common questions
3. **Feature Comparison**: Detailed table comparing all tiers
4. **CTA Section**: Call-to-action to get started

**Key Actions:**
- Plan CTA buttons → (Links to signup in real app)
- "Learn More" → Read plan details
- FAQ accordions → Expand to read answers

---

## 👤 User Pages (Authenticated Users)

### Dashboard (`/dashboard`)
**Personal overview and statistics**
- At-a-glance metrics and KPIs
- Recent activity summary
- Quick navigation to key pages

**Stat Cards:**
- **Total Bookings**: Number and active count
- **Total Budget**: Amount spent across campaigns
- **KOLs Worked With**: Number of unique creators
- **Average Rating**: Based on all reviews received

**Recent Bookings Section:**
- Table of latest 5 bookings
- Campaign name, KOL name, budget, status
- "View all" link to `/bookings`

**Recent Reviews Section:**
- Feed of latest 3 reviews
- Reviewer avatar and name
- Star rating
- Review preview
- "View all" link to `/reviews`

**Quick Actions:**
- "Discover KOLs" → Go to `/discover`
- "Read Reviews" → Go to `/reviews`

---

### Profile Settings (`/profile`)
**Personal account management**

**Sections:**
1. **Profile Picture**
   - Avatar upload area
   - Preview of current avatar

2. **Personal Information**
   - Full name
   - Email address
   - Phone number
   - Country selector

3. **Company Information**
   - Company name
   - Industry selector

4. **Danger Zone**
   - Delete account button
   - Irreversible action warning

**Key Actions:**
- "Upload Photo" → Change profile picture
- "Save Changes" → Update profile
- "Cancel" → Discard changes
- "Delete Account" → Permanent deletion

---

## 🧭 Navigation Header

Available on all pages:

**Left Side:**
- **Logo** → Returns to home page (`/`)
- **KOL Hub** → Returns to home page

**Desktop Navigation Menu:**
- Discover KOLs → `/discover`
- My Bookings → `/bookings`
- Dashboard → `/dashboard`
- Pricing → `/pricing`

**Right Side:**
- **Search Icon** → Opens search (links to discover page)
- **User Avatar** → Dropdown menu
  - My Profile → `/profile`
  - Dashboard → `/dashboard`
  - Settings → `/profile`
  - Logout → (In real app)

**Mobile Menu:**
- Hamburger icon reveals navigation
- Same links as desktop
- Collapses when link clicked

---

## 🔍 Search & Navigation Flows

### Finding a KOL
1. Start at Home (`/`)
2. Click "Discover KOLs" or use search bar
3. Land on `/discover`
4. Use filters to narrow results
5. Click "View Profile" on desired KOL
6. View full profile on `/kol/[id]`

### Booking a KOL
1. Find KOL on `/discover` or `/kol/[id]`
2. Click "View Profile" or "Book Now"
3. Land on KOL profile page
4. Click "Book Now" button
5. Fill booking form modal
6. Submit booking
7. View booking on `/bookings`

### Checking Reviews
1. Click "Reviews" in navigation
2. Land on `/reviews`
3. Explore rating distribution
4. Sort by recent/helpful/rating
5. Filter by star rating
6. Vote reviews as helpful

### Managing Account
1. Click user avatar (top right)
2. Select "My Profile" or "Settings"
3. Land on `/profile`
4. Update personal/company information
5. Save changes

---

## 📊 Data Flow

```
Home (/)
  ↓
  ├─→ Discover (/discover)
  │     ↓
  │     └─→ KOL Profile (/kol/[id])
  │           ↓
  │           └─→ Booking Form Modal
  │                 ↓
  │                 └─→ Bookings (/bookings)
  │
  ├─→ Pricing (/pricing)
  │     ↓
  │     └─→ Home (/) or Discover
  │
  └─→ Dashboard (/dashboard)
        ├─→ Recent Bookings → Bookings (/bookings)
        ├─→ Recent Reviews → Reviews (/reviews)
        └─→ Discover KOLs → Discover (/discover)

Reviews (/reviews)
  ↓
  └─→ Filter and Sort options
```

---

## 🎯 Quick Links Reference

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Platform overview |
| Discover | `/discover` | Search and browse KOLs |
| KOL Profile | `/kol/[id]` | View creator details |
| Bookings | `/bookings` | Manage campaigns |
| Reviews | `/reviews` | Read feedback |
| Dashboard | `/dashboard` | View statistics |
| Pricing | `/pricing` | See plans |
| Profile | `/profile` | Edit account |

---

## 💡 Tips for Users

1. **Search Efficiently**: Use keywords in the search bar for quick results
2. **Filter Smart**: Combine filters (category + platform + price) for better results
3. **Check Reviews**: Always read reviews before booking a KOL
4. **Review Ratings**: Hover over star ratings to see distribution
5. **Bookmark Favorites**: Click heart icon on KOL cards to save favorites
6. **Track Bookings**: Use dashboard to see all active campaigns at a glance
7. **Update Profile**: Keep your profile information current for better matches

---

## 🚀 Getting Started Checklist

- [ ] Explore home page to understand the platform
- [ ] Browse KOLs on discovery page
- [ ] View at least one KOL profile
- [ ] Try filtering by category or platform
- [ ] Read some reviews
- [ ] Check out pricing options
- [ ] Create a test booking
- [ ] Visit dashboard to see overview
- [ ] Update profile with your information

---

**Happy KOL booking! 🎉**

For questions or support, visit the FAQ section on the Pricing page.
