# KOL Profiles - Complete Guide

## Overview

The KOL Profiles section is a comprehensive system for viewing, managing, and analyzing influencer/KOL profiles. It includes multiple views and detailed profile pages.

## Features

### 1. KOL Profiles List Page (`/kol-profiles`)

**Main Features:**
- Dashboard with 4 key statistics (Total KOLs, Active, Verified, Average Rating)
- Advanced search and filtering system
- Two view modes: Grid and Table
- Quick profile preview modal

**Search & Filtering:**
- **Search Bar**: Search by KOL name, username, or bio
- **Category Filter**: Filter by content category
- **Status Filter**: Filter by Active, Inactive, or On Holiday status
- **Sort Options**: 
  - Sort by Followers (default)
  - Sort by Rating
  - Sort by Engagement Rate
  - Sort by Previous Campaigns

**Grid View:**
- Card-based layout with visual profiles
- Shows avatar, name, verification badge, status badge
- Displays category and platform
- Key stats: Followers, Engagement Rate, Rating, Previous Campaigns
- Pricing information (Hourly & Monthly rates)
- Three action buttons: View Profile, Edit, Delete

**Table View:**
- Condensed table format for comparing multiple KOLs
- Shows: Profile, Category, Followers, Engagement, Rating, Status, Hourly Rate
- Action buttons for each row

**Quick Profile Modal:**
- Click "View Profile" button to open detailed modal
- Shows comprehensive KOL information
- Includes: Stats, Pricing, Reviews, Contact options
- "View Full Profile" button links to dedicated detail page
- "Book Now" button for initiating bookings

### 2. KOL Profile Detail Page (`/kol-profiles/[id]`)

**Hero Section:**
- Large avatar with verification badge
- KOL name, username, and favorite button
- Status, category, and platform badges
- Quick stats (Followers, Engagement, Rating, Campaigns)
- Back navigation to profiles list

**Main Content:**
- **About Section**: Full bio/description
- **Tabbed Content**:
  - **Overview Tab**: Detailed statistics, pricing, and campaign information
  - **Reviews Tab**: All reviews from clients with ratings and comments
  - **Portfolio Tab**: Links and portfolio content (extensible)

**Detailed Stats:**
- Followers (formatted with thousands)
- Engagement Rate (percentage)
- Previous Campaigns (count)
- Review Count

**Pricing Display:**
- Hourly Rate
- Monthly Rate
- Highlighted with distinct colors

**Sidebar:**
- **Rating Summary**:
  - Overall rating score
  - Star visualization
  - Rating breakdown by stars (1-5)
  - Review count
- **Action Buttons**:
  - Book Now (opens booking form)
  - Send Message
  - Report Profile
- **Contact Section**:
  - Send Email
  - Direct Message
  - Visit Website

**Responsive Design:**
- Sticky sidebar for desktop
- Stacked layout for mobile
- Optimized for all screen sizes

## User Interactions

### Viewing Profiles

1. **Navigate to KOL Profiles**
   - Use main navigation menu
   - Go to `/kol-profiles`

2. **Search & Filter**
   - Use search bar for quick lookup
   - Apply category, status, and sort filters
   - View count updates in real-time

3. **Choose View Mode**
   - Select Grid for visual overview
   - Select Table for detailed comparison

4. **Quick Preview**
   - Click "View Profile" button
   - Modal opens with detailed information
   - Use "View Full Profile" to open full page

5. **Full Profile View**
   - Click "View Full Profile" from modal
   - Or access directly via `/kol-profiles/[id]`
   - Browse overview, reviews, portfolio
   - Use sidebar actions

### Booking from Profile

1. **From Quick Modal**
   - Click "Book Now" in profile modal
   - Booking form opens
   - Submit campaign details

2. **From Detail Page**
   - Scroll to sidebar
   - Click "Book Now" button
   - Booking form modal appears
   - Fill campaign information

3. **Messaging**
   - Click "Send Message" button
   - Opens messaging interface
   - Send direct communication

## Technical Implementation

### Components Used

- **KOLDetailModal** (`@/components/kol-detail-modal`)
  - Reusable modal component
  - Shows comprehensive KOL info
  - Includes booking and full profile link

- **BookingForm** (`@/components/booking-form`)
  - Handles campaign booking creation
  - Collects campaign details and budget
  - Validates and submits bookings

- **Header** (`@/components/header`)
  - Navigation with KOL Profiles link
  - Responsive design support

### Data Flow

```
/kol-profiles (List Page)
├── Display filtered KOLs
├── Open modal on "View Profile" click
└── Navigate to [id] page

/kol-profiles/[id] (Detail Page)
├── Load KOL details
├── Display stats, reviews, portfolio
├── Handle booking request
└── Allow messaging/contact

Modal Component
├── Show quick overview
├── Link to full profile
└── Quick booking option
```

### State Management

- `selectedKOL`: Track which KOL modal is open
- `activeTab`: Track current tab in detail page
- `isFavorite`: Track favorite status
- `showBookingForm`: Control booking form visibility
- `searchQuery`, `filters`, `sortBy`: Manage list filtering

## Features by User Type

### Brand/Client Users
- Search and discover KOLs
- Filter by relevant categories
- Compare KOLs side-by-side
- View detailed profiles and reviews
- Book campaigns directly
- Contact KOLs via messaging

### Admin Users (Future)
- Manage KOL profiles
- Edit KOL information
- Delete/suspend profiles
- View analytics
- Manage disputes

## Customization Options

### Add Custom Filters
Modify `selectedStatus`, `selectedCategory`, or `sortBy` in page component

### Customize Card Layout
Edit grid cards in Grid View section

### Modify Modal Content
Update `KOLDetailModal` component for different information display

### Add Portfolio Features
Implement portfolio items in "Portfolio" tab

## Performance Considerations

- Mock data loaded once at component render
- Filtering happens client-side
- Modal prevents full page reload
- Sticky sidebar optimized for desktop
- Responsive images with object-cover

## Future Enhancements

- [ ] KOL availability calendar
- [ ] Advanced analytics dashboard
- [ ] Messaging platform integration
- [ ] Payment processing
- [ ] Video portfolio showcase
- [ ] Real-time notifications
- [ ] Advanced recommendations
- [ ] KOL certification system
- [ ] Performance metrics tracking
- [ ] Integration with social platforms

## URLs Reference

| Route | Purpose |
|-------|---------|
| `/kol-profiles` | KOL profiles list and management |
| `/kol-profiles/[id]` | Detailed KOL profile view |
| `/kol/[id]` | Alternative detail page |
| `/discover` | KOL discovery with search |
| `/bookings` | View all bookings |

## Troubleshooting

**Modal not opening:**
- Check that `selectedKOL` state is updating
- Verify `KOLDetailModal` component is imported
- Check console for errors

**Profile detail page not loading:**
- Verify KOL ID in URL
- Check mock data includes the KOL
- Ensure `mockKOLs` is imported correctly

**Filters not working:**
- Check filter state updates
- Verify filter logic in `filteredKOLs` array
- Test with sample data

## Code Examples

### Opening Profile Modal
```jsx
const [selectedKOL, setSelectedKOL] = useState<KOL | null>(null);

<button onClick={() => setSelectedKOL(kol)}>
  View Profile
</button>

{selectedKOL && (
  <KOLDetailModal
    kol={selectedKOL}
    onClose={() => setSelectedKOL(null)}
  />
)}
```

### Navigating to Detail Page
```jsx
import Link from 'next/link';

<Link href={`/kol-profiles/${kol.id}`}>
  View Full Profile
</Link>
```

---

**Last Updated:** April 2026
**Version:** 1.0
