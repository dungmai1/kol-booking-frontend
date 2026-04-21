export interface KOL {
  id: string;
  name: string;
  username: string;
  avatar: string;
  category: string;
  platform: string;
  followers: number;
  engagementRate: number;
  hourlyRate: number;
  monthlyRate: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  bio: string;
  portfolioUrl?: string;
  previousCampaigns: number;
  status: 'active' | 'on_holiday' | 'inactive';
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  avatar: string;
  email: string;
  industry: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
}

export interface Booking {
  id: string;
  kolId: string;
  clientId: string;
  campaignName: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  deliverables: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Mock KOLs Data
export const mockKOLs: KOL[] = [
  {
    id: 'kol_1',
    name: 'Nguyễn Hương Giang',
    username: '@huonggiang.official',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    category: 'Beauty & Cosmetics',
    platform: 'Instagram',
    followers: 850000,
    engagementRate: 8.5,
    hourlyRate: 500,
    monthlyRate: 8000,
    rating: 4.8,
    reviewCount: 156,
    verified: true,
    bio: 'Beauty & lifestyle content creator | Partnership inquiries: business@huonggiang.com',
    portfolioUrl: 'https://huonggiang.com',
    previousCampaigns: 45,
    status: 'active',
  },
  {
    id: 'kol_2',
    name: 'Tú Anh Blogger',
    username: '@tuanh_lifestyle',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    category: 'Fashion & Lifestyle',
    platform: 'Instagram',
    followers: 620000,
    engagementRate: 7.2,
    hourlyRate: 400,
    monthlyRate: 6500,
    rating: 4.7,
    reviewCount: 128,
    verified: true,
    bio: 'Fashion blogger | Street style enthusiast | DM for collaborations',
    previousCampaigns: 38,
    status: 'active',
  },
  {
    id: 'kol_3',
    name: 'Phạm Hương',
    username: '@phamhuong',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    category: 'Travel & Adventure',
    platform: 'Instagram',
    followers: 920000,
    engagementRate: 9.1,
    hourlyRate: 600,
    monthlyRate: 10000,
    rating: 4.9,
    reviewCount: 189,
    verified: true,
    bio: 'Travel & adventure content | Exploring the world 🌍',
    previousCampaigns: 67,
    status: 'active',
  },
  {
    id: 'kol_4',
    name: 'Trần Thanh Nam',
    username: '@thanhnampro',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    category: 'Technology & Gadgets',
    platform: 'YouTube',
    followers: 450000,
    engagementRate: 6.8,
    hourlyRate: 350,
    monthlyRate: 5500,
    rating: 4.6,
    reviewCount: 94,
    verified: true,
    bio: 'Tech reviews and gadget unboxing | Subscribe for latest tech news',
    previousCampaigns: 32,
    status: 'active',
  },
  {
    id: 'kol_5',
    name: 'Lê Minh Phương',
    username: '@minhphuong.chef',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    category: 'Food & Culinary',
    platform: 'TikTok',
    followers: 1200000,
    engagementRate: 12.3,
    hourlyRate: 800,
    monthlyRate: 12000,
    rating: 4.9,
    reviewCount: 203,
    verified: true,
    bio: 'Food creator & cooking tutorials | Viral recipes',
    previousCampaigns: 78,
    status: 'active',
  },
  {
    id: 'kol_6',
    name: 'Vũ Thảo Nhi',
    username: '@thaonhi.fitness',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    category: 'Fitness & Health',
    platform: 'Instagram',
    followers: 380000,
    engagementRate: 7.9,
    hourlyRate: 300,
    monthlyRate: 4500,
    rating: 4.7,
    reviewCount: 102,
    verified: true,
    bio: 'Fitness trainer & health enthusiast | Transform your lifestyle',
    previousCampaigns: 28,
    status: 'active',
  },
  {
    id: 'kol_7',
    name: 'Đặng Huy Phúc',
    username: '@huyphuc.gaming',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    category: 'Gaming & Esports',
    platform: 'Twitch',
    followers: 560000,
    engagementRate: 11.5,
    hourlyRate: 450,
    monthlyRate: 7000,
    rating: 4.8,
    reviewCount: 141,
    verified: true,
    bio: 'Professional gamer | Stream schedule: Mon-Fri 8PM',
    previousCampaigns: 35,
    status: 'active',
  },
  {
    id: 'kol_8',
    name: 'Hoàng Thúy Vân',
    username: '@thuyvanceramics',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    category: 'Arts & Crafts',
    platform: 'Instagram',
    followers: 280000,
    engagementRate: 8.7,
    hourlyRate: 250,
    monthlyRate: 3800,
    rating: 4.9,
    reviewCount: 67,
    verified: false,
    bio: 'DIY & crafts creator | Handmade with love',
    previousCampaigns: 15,
    status: 'active',
  },
];

// Mock Clients Data
export const mockClients: Client[] = [
  {
    id: 'client_1',
    name: 'Hà Nội Beauty Brand',
    companyName: 'Beauty Vietnam Corp',
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    email: 'contact@beautyvietnam.com',
    industry: 'Beauty & Cosmetics',
    verified: true,
    rating: 4.7,
    reviewCount: 45,
  },
  {
    id: 'client_2',
    name: 'TP HCM Fashion Store',
    companyName: 'FashionHub Vietnam',
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    email: 'partnerships@fashionhub.vn',
    industry: 'Fashion & Retail',
    verified: true,
    rating: 4.5,
    reviewCount: 32,
  },
  {
    id: 'client_3',
    name: 'Tech Innovations Ltd',
    companyName: 'TechVN Solutions',
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    email: 'marketing@techvn.com',
    industry: 'Technology',
    verified: true,
    rating: 4.8,
    reviewCount: 28,
  },
];

// Mock Bookings Data
export const mockBookings: Booking[] = [
  {
    id: 'booking_1',
    kolId: 'kol_1',
    clientId: 'client_1',
    campaignName: 'Summer Beauty Campaign 2024',
    description: 'Collaborate on summer makeup collection launch',
    budget: 5000,
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    status: 'accepted',
    deliverables: ['5 Instagram Posts', '3 Reels', '1 TikTok'],
    createdAt: '2024-05-15',
  },
  {
    id: 'booking_2',
    kolId: 'kol_2',
    clientId: 'client_2',
    campaignName: 'Fashion Week Showcase',
    description: 'Feature new collection during fashion week',
    budget: 3500,
    startDate: '2024-07-10',
    endDate: '2024-07-25',
    status: 'pending',
    deliverables: ['10 Posts', '5 Reels', 'Instagram Stories'],
    createdAt: '2024-06-20',
  },
  {
    id: 'booking_3',
    kolId: 'kol_5',
    clientId: 'client_1',
    campaignName: 'Food Product Review',
    description: 'Review and showcase new food products',
    budget: 2000,
    startDate: '2024-08-01',
    endDate: '2024-08-15',
    status: 'completed',
    deliverables: ['3 TikToks', '5 Instagram Stories', '1 Video'],
    createdAt: '2024-07-10',
  },
];

// Mock Reviews Data
export const mockReviews: Review[] = [
  {
    id: 'review_1',
    bookingId: 'booking_1',
    reviewerId: 'client_1',
    reviewerName: 'Beauty Vietnam Corp',
    reviewerAvatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    rating: 5,
    comment: 'Excellent collaboration! Nguyễn Hương Giang delivered outstanding content. Highly recommended!',
    createdAt: '2024-07-05',
  },
  {
    id: 'review_2',
    bookingId: 'booking_3',
    reviewerId: 'client_1',
    reviewerName: 'Beauty Vietnam Corp',
    reviewerAvatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    rating: 4,
    comment: 'Great content creation and professional approach. Very happy with the results.',
    createdAt: '2024-08-20',
  },
  {
    id: 'review_3',
    bookingId: 'booking_1',
    reviewerId: 'kol_1',
    reviewerName: 'Nguyễn Hương Giang',
    reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 5,
    comment: 'Professional team, clear communication, and fair payment. Perfect partnership!',
    createdAt: '2024-07-08',
  },
];

// Mock Categories
export const mockCategories = [
  'Beauty & Cosmetics',
  'Fashion & Lifestyle',
  'Travel & Adventure',
  'Technology & Gadgets',
  'Food & Culinary',
  'Fitness & Health',
  'Gaming & Esports',
  'Arts & Crafts',
  'Music & Entertainment',
  'Business & Finance',
];
