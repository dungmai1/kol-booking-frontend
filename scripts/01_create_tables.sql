-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  icon_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  country VARCHAR(100),
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('kol', 'client', 'admin')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create KOL profiles table
CREATE TABLE IF NOT EXISTS kol_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  category_id UUID REFERENCES categories(id),
  platform VARCHAR(100), -- instagram, tiktok, youtube, facebook
  follower_count INT DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  monthly_rate DECIMAL(10, 2),
  bio TEXT,
  portfolio_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  available_dates TEXT, -- JSON format for available dates
  previous_campaigns INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_holiday')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client profiles table
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  company_url VARCHAR(500),
  company_logo_url VARCHAR(500),
  company_description TEXT,
  industry VARCHAR(100),
  company_size VARCHAR(50), -- startup, small, medium, large, enterprise
  budget DECIMAL(12, 2),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kol_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  platform VARCHAR(100),
  budget DECIMAL(10, 2) NOT NULL,
  duration_days INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  deliverables TEXT, -- JSON format
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  contract_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories_array TEXT[], -- professionalism, quality, communication, punctuality
  would_recommend BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id VARCHAR(255) UNIQUE,
  payment_method VARCHAR(50), -- card, bank_transfer, wallet
  paid_by UUID NOT NULL REFERENCES users(id), -- client
  paid_to UUID NOT NULL REFERENCES users(id), -- kol
  fee_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create admin activities table
CREATE TABLE IF NOT EXISTS admin_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- user, profile, booking, review, payment
  target_id UUID,
  details TEXT, -- JSON format
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_user_id ON kol_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_category_id ON kol_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_verified ON kol_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_rating ON kol_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_kol_id ON bookings(kol_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_created_at ON admin_activities(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON users
  FOR SELECT USING (true);

-- RLS Policies for KOL profiles (publicly viewable)
CREATE POLICY "KOL profiles are viewable by all" ON kol_profiles
  FOR SELECT USING (true);

CREATE POLICY "KOL can update their own profile" ON kol_profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for client profiles
CREATE POLICY "Client profiles visible to their users" ON client_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Clients can update their own profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = kol_id OR
    auth.uid() = client_id OR
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Clients can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'client'
  );

CREATE POLICY "Users can update relevant bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = kol_id OR
    auth.uid() = client_id OR
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by relevant parties" ON reviews
  FOR SELECT USING (
    auth.uid() = reviewer_id OR
    auth.uid() = reviewee_id OR
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create reviews after booking completion" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND status = 'completed'
    )
  );

-- RLS Policies for payments
CREATE POLICY "Payment parties can view payments" ON payments
  FOR SELECT USING (
    auth.uid() = paid_by OR
    auth.uid() = paid_to OR
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for admin activities
CREATE POLICY "Admins can view admin activities" ON admin_activities
  FOR SELECT USING (
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can create admin activities" ON admin_activities
  FOR INSERT WITH CHECK (
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for categories (public read)
CREATE POLICY "Categories are viewable by all" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
  );
