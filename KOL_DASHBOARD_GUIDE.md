# KOL Dashboard Guide

## Overview
The KOL Dashboard (`/kol/[user_kol]`) is a dedicated personal space for each KOL (Key Opinion Leader) to manage their profile, view bookings, reviews, and account settings.

## Route Structure
- **URL Pattern**: `/kol/{username}` (e.g., `/kol/huonggiang`)
- **Parameter**: `user_kol` - The username of the KOL (without the @ symbol)
- **Type**: Dynamic route using Next.js dynamic segments

## Main Features

### 1. Header Section
- **Profile Image**: Large avatar with status indicator
  - Green dot = Active status
  - Blue checkmark = Verified badge
- **KOL Info**: Name, username, category, and platform
- **Action Buttons**:
  - Edit Profile - Toggle edit mode for quick edits
  - Settings - Access account settings

### 2. Statistics Dashboard (4 Cards)

#### Followers Card
- Shows total followers count on their platform
- Displays platform name
- Icon: Users

#### Engagement Rate Card
- Shows average engagement percentage
- Contextual information about engagement
- Icon: TrendingUp (green)

#### Total Earnings Card
- Cumulative earnings from completed bookings
- Formatted currency display
- Icon: DollarSign (yellow)

#### Rating Card
- Star rating with visual stars
- Number of reviews received
- Calculated from all reviews
- Icon: Star (yellow)

### 3. Alert System
- Shows yellow alert banner if there are pending bookings
- Displays count of waiting bookings
- Quick action to view pending items

### 4. Tab Navigation
The dashboard has 4 main tabs:

#### Overview Tab
- **About Section**: KOL bio and portfolio link
- **Pricing Section**: Hourly and monthly rates
- **Quick Stats**: Previous campaigns and total reviews

#### Bookings Tab
- **List View**: All bookings with full details
- **Booking Card Contains**:
  - Campaign name and description
  - Date range of campaign
  - Budget amount
  - Status badge (Pending, Accepted, Completed, Rejected)
  - Accept/Decline buttons (for pending bookings)
- **Empty State**: Message when no bookings exist

#### Reviews Tab
- **Review Cards**: Each review displays:
  - Reviewer avatar and name
  - Star rating (1-5 stars)
  - Review comment/text
  - Date of review
- **Empty State**: Message when no reviews exist
- Shows reviews from clients who booked them

#### Settings Tab
- **Account Settings Section**:
  - Email field (editable)
  - Phone number field (editable)
  - Bio textarea (editable)
  - Save Changes button
  - Cancel button
- **Danger Zone**:
  - Deactivate Account button (red)
  - Account closure option

## Data Flow

### Mock Data Integration
The dashboard uses data from `/lib/mock-data.ts`:
1. **KOL Lookup**: Finds KOL by matching username
2. **Bookings Filter**: Gets bookings where `kolId` matches
3. **Reviews Filter**: Gets reviews for bookings associated with the KOL
4. **Statistics Calculation**:
   - Total Earnings: Sum of completed booking budgets
   - Avg Rating: Average of all review ratings
   - Pending Count: Count of pending status bookings

### User Identification
Currently hardcoded example:
```
/kol/huonggiang → Finds "@huonggiang.official" KOL
```

## Responsive Design
- **Mobile (< 768px)**:
  - Single column layout
  - Stacked buttons and stats
  - Full-width elements
  - Mobile menu navigation
  
- **Tablet (768px - 1024px)**:
  - 2-column grid for some sections
  - Better spacing
  - Adjusted button sizing

- **Desktop (> 1024px)**:
  - 4-column stats grid
  - Full layout optimization
  - Sidebar ready layout

## Interactive Features

### Edit Mode
- Clicking "Edit Profile" toggles edit mode
- Button text changes to "Done"
- In edit mode, forms can be modified (UI ready, not functional)

### Tab Switching
- Click tab to switch between sections
- Active tab shows blue underline
- Tab icons for visual reference
- Smooth transitions

### Pending Bookings
- Alert banner appears if `pendingBookings > 0`
- Shows count with proper grammar
- Quick action link to view

### Booking Actions
- Accept button (green) - for pending bookings
- Decline button (red) - for pending bookings
- Status badges with color coding:
  - Yellow = Pending
  - Blue = Accepted
  - Green = Completed
  - Red = Rejected/Cancelled

## Styling & UI

### Color Scheme
- Primary: Blue (#2563EB) - Headers, buttons, accents
- Secondary: Green (#16A34A) - Positive actions, active status
- Neutral: Gray palette - Text, borders, backgrounds
- Semantic colors - Yellow, Red for alerts and dangers

### Component Patterns
- Card-based layout with borders and hover effects
- Consistent button styling across the page
- Icon usage for quick visual scanning
- Status badges for quick understanding
- Empty states with icons and helpful messages

## Future Enhancements

### Planned Features
1. **Real Data Integration**:
   - Connect to actual database
   - Persist profile changes
   - Real-time booking updates

2. **Advanced Analytics**:
   - Monthly earnings chart
   - Booking trend graph
   - Review sentiment analysis
   - Performance metrics

3. **Content Management**:
   - Portfolio image uploads
   - Portfolio link management
   - Gallery management

4. **Communication**:
   - Direct messaging with clients
   - Notifications system
   - Email preferences

5. **Advanced Settings**:
   - Profile privacy controls
   - Automatic booking acceptance
   - Rate adjustment
   - Availability calendar

## Testing the Dashboard

### Example KOL URLs
To test different KOLs, use these usernames (derived from mock data):
- `/kol/huonggiang` - Nguyễn Hương Giang
- `/kol/tranghoangnguyen` - Trần Hoàng Nguyên
- `/kol/laminh` - Lâm Minh
- `/kol/phihoai` - Phí Hòa Ái
- `/kol/levanson` - Lê Văn Sơn

### Navigation Tips
1. From Header: Click "My Dashboard" link
2. From KOL Profiles: Click "View Full Profile" then navigate
3. Direct URL: Type `/kol/[username]` in address bar

## Code Structure

### Main Component File
- Location: `/app/kol/[user_kol]/page.tsx`
- Type: Client component ('use client')
- State Management: `useState` for tabs and edit mode
- Logic: KOL lookup, filtering, calculations

### Key Variables
```typescript
kol - Current KOL object
kolBookings - Filtered bookings array
kolReviews - Filtered reviews array
activeTab - Current active tab
editMode - Edit mode toggle
totalEarnings - Calculated earnings
avgRating - Average review rating
pendingBookings - Count of pending items
```

### Event Handlers
- `setActiveTab()` - Tab switching
- `setEditMode()` - Toggle edit mode
- Alert actions - Placeholder handlers for future implementation

## Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Icon descriptions via title attributes
- Keyboard navigation support
- Color-coded status badges with text labels
- ARIA-ready structure

## Performance Considerations
- Client-side rendering with mock data
- No external API calls (using mock data)
- Efficient filtering with `.filter()`
- Optimized re-renders with proper state management
- Lazy-loaded image avatars

---

**Last Updated**: April 2026
**Version**: 1.0
