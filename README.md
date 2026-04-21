# KOL Hub - Influencer Booking Platform

A modern web platform for discovering, managing, and booking content creators (KOCs/KOLs) for brand campaigns. Built with Next.js, React, TypeScript, and Tailwind CSS.

## Project Overview

KOL Hub connects brands with talented influencers and content creators across multiple platforms (Instagram, TikTok, YouTube, etc.). The platform provides:

- **KOL Discovery**: Search and filter creators by category, platform, followers, engagement rate, and pricing
- **Profile Management**: Detailed KOL profiles with ratings, reviews, and campaign history
- **Booking System**: Request-based booking with contract management and deliverables tracking
- **Review System**: Ratings and feedback from both brands and creators
- **Dashboard**: Comprehensive overview of bookings, campaigns, and performance metrics
- **Pricing Plans**: Tiered subscription model for different user needs

## Features

### Core Pages

1. **Home Page** (`/`)
   - Hero section with platform overview
   - Quick search functionality
   - Feature highlights
   - Popular categories browsing
   - Footer with navigation links

2. **KOL Discovery** (`/discover`)
   - Advanced search with filters
   - Filter by category, platform, rating, and price range
   - Responsive grid layout of KOL cards
   - Real-time search across 8+ mock KOLs
   - Category and platform filtering

3. **KOL Profiles** (`/kol/[id]`)
   - Detailed creator information
   - Engagement metrics and followers
   - Portfolio and links
   - Past reviews and ratings
   - Pricing information (hourly/monthly)
   - Booking form modal

4. **Bookings** (`/bookings`)
   - View all booking requests
   - Filter by status (pending, accepted, completed)
   - Booking details modal
   - Campaign information and deliverables
   - Status tracking

5. **Reviews** (`/reviews`)
   - Community feedback and ratings
   - Rating distribution visualization
   - Sort by recent, helpful, or highest rated
   - Filter by star rating
   - Review card component with helpful voting

6. **Dashboard** (`/dashboard`)
   - Summary statistics
   - Active bookings count
   - Total budget spent
   - Average ratings
   - Recent bookings table
   - Recent reviews feed

7. **Pricing** (`/pricing`)
   - Three pricing tiers (Starter, Professional, Enterprise)
   - Feature comparison table
   - FAQ section
   - Clear value propositions

8. **Profile Settings** (`/profile`)
   - Personal information editing
   - Company information management
   - Profile picture upload
   - Bio and preferences

## Project Structure

```
├── app/
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Root layout
│   ├── discover/
│   │   └── page.tsx             # KOL discovery page
│   ├── kol/
│   │   └── [id]/
│   │       └── page.tsx         # KOL detail page
│   ├── bookings/
│   │   └── page.tsx             # Bookings management
│   ├── reviews/
│   │   └── page.tsx             # Reviews listing
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard
│   ├── pricing/
│   │   └── page.tsx             # Pricing page
│   └── profile/
│       └── page.tsx             # Profile settings
├── components/
│   ├── header.tsx               # Navigation header
│   ├── kol-card.tsx             # KOL profile card
│   ├── booking-form.tsx         # Booking modal form
│   └── review-card.tsx          # Individual review card
├── lib/
│   └── mock-data.ts             # Mock data for all entities
└── public/                       # Static assets
```

## Data Model

### Mock Data Entities

**KOL (Content Creator)**
- ID, name, username, avatar
- Category, platform (Instagram, TikTok, YouTube, etc.)
- Followers, engagement rate
- Hourly and monthly rates
- Rating and review count
- Verified status
- Portfolio and bio

**Client (Brand)**
- ID, name, company name, avatar
- Industry and company size
- Verified status
- Rating and review count

**Booking**
- Campaign name and description
- Budget and duration
- Start/end dates
- Deliverables list
- Status (pending, accepted, rejected, completed, cancelled)
- Contract information

**Review**
- Rating (1-5 stars)
- Comment
- Reviewer information
- Helpful vote counter
- Timestamp

**Categories**
- 10 categories including:
  - Beauty & Cosmetics
  - Fashion & Lifestyle
  - Travel & Adventure
  - Technology & Gadgets
  - Food & Culinary
  - Fitness & Health
  - Gaming & Esports
  - Arts & Crafts
  - Music & Entertainment
  - Business & Finance

## Component Architecture

### Shared Components

- **Header** (`components/header.tsx`)
  - Sticky navigation with logo
  - Mobile menu with responsive design
  - User menu with profile options
  - Search input

- **KOLCard** (`components/kol-card.tsx`)
  - Profile image and verification badge
  - Name, username, category
  - Followers and engagement stats
  - Rating and review count
  - Pricing information
  - View profile button (links to detail page)

- **BookingForm** (`components/booking-form.tsx`)
  - Modal form for creating bookings
  - Campaign details input
  - Date range picker
  - Budget input with suggestions
  - Deliverables list textarea
  - Form validation and submission

- **ReviewCard** (`components/review-card.tsx`)
  - Reviewer avatar and name
  - Star rating display
  - Review comment
  - Helpful voting button
  - Date information

## Styling

- **Framework**: Tailwind CSS v4
- **Icons**: Lucide React
- **Color Scheme**:
  - Primary: Blue (#2563EB)
  - Secondary: Purple (#9333EA)
  - Neutrals: Grays
  - Accent: Yellow (ratings)
  
- **Responsive Design**: Mobile-first approach with breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## Mock Data

The platform uses comprehensive mock data with:
- 8 KOLs across different categories and platforms
- 3 Clients/Brands
- 3 Bookings in various statuses
- 3 Reviews with ratings
- 10 Categories

Mock data is centralized in `lib/mock-data.ts` and imported across pages.

## Features in Detail

### Search & Filter
- Real-time search by name, username, category, or bio
- Filter by category dropdown
- Filter by platform dropdown
- Min rating slider (0-5 stars)
- Max monthly price slider ($1,000-$20,000)
- Clear filters button

### Booking Flow
1. Browse KOL profiles
2. Click "View Profile" on KOL card or "Book Now"
3. Fill booking form with campaign details
4. Specify dates, budget, and deliverables
5. Submit booking request
6. View booking status on bookings page

### Review System
- Separate review page with all community feedback
- Rating distribution visualization
- Sort options (recent, helpful, highest rated)
- Filter by star rating
- Helpful voting on reviews

### Dashboard Overview
- Key metrics cards (total bookings, budget, KOLs, rating)
- Recent bookings table with status
- Recent reviews feed
- Quick action CTA

## Performance Optimizations

- Next.js Image components for optimization (ready for implementation)
- Component-based architecture for code reusability
- Efficient state management with React hooks
- Responsive images and lazy loading support

## Future Enhancements

- Database integration (Supabase, Neon, etc.)
- User authentication system
- Payment processing (Stripe)
- Real-time messaging between brands and KOLs
- Advanced analytics and reporting
- Contract document generation
- Campaign performance tracking
- Notification system
- Email integration
- Admin moderation dashboard

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - Feel free to use this project for your own purposes.

## Support

For questions or issues, please contact support@kolhub.com or visit the help center at `/pricing` (FAQ section included).

---

**Built with Next.js 16 + React 19 + TypeScript + Tailwind CSS**
"# kol_booking" 
"# kol-booking-frontend" 
