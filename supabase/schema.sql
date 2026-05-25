-- ============================================
-- WarungKu Smart UMKM Food Platform
-- Database Schema for Supabase (Updated with COD)
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'Makanan Berat',
  is_featured BOOLEAN DEFAULT FALSE,
  order_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (Updated with 'cod' payment method and guest checkout support)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  guest_name TEXT,
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'completed', 'cancelled')),
  payment_method TEXT DEFAULT 'transfer' CHECK (payment_method IN ('transfer', 'qris', 'cod')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_order_count ON public.products(order_count DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user, and if so, make them admin
  DECLARE 
    initial_role TEXT DEFAULT 'customer';
  BEGIN
    IF (SELECT count(*) FROM public.profiles) = 0 THEN
      initial_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
      NEW.email,
      initial_role
    );
    RETURN NEW;
  END;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- Seed Data - Products (Matching dummyData.js)
-- ============================================

TRUNCATE public.products RESTART IDENTITY CASCADE;

INSERT INTO public.products (name, price, stock, image_url, description, category, is_featured, order_count, rating) VALUES
  ('Nasi Goreng Spesial', 25000, 50, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop&q=80', 'Nasi goreng dengan telur mata sapi, ayam suwir, dan kerupuk. Dimasak dengan bumbu rahasia turun-temurun yang kaya rempah.', 'Makanan Berat', true, 156, 4.8),
  ('Rendang Daging Sapi', 45000, 30, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=400&fit=crop&q=80', 'Rendang daging sapi empuk yang dimasak berjam-jam dengan santan dan rempah pilihan. Khas Minangkabau.', 'Makanan Berat', true, 124, 4.9),
  ('Sate Ayam Madura', 30000, 40, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&q=80', '10 tusuk sate ayam dengan bumbu kacang khas Madura. Disajikan dengan lontong dan acar mentimun.', 'Makanan Berat', true, 98, 4.7),
  ('Mie Ayam Bakso', 20000, 60, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=400&fit=crop&q=80', 'Mie ayam dengan bakso sapi kenyal, pangsit goreng, dan kuah kaldu sapi yang gurih.', 'Makanan Berat', false, 87, 4.6),
  ('Gado-Gado Jakarta', 22000, 35, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&q=80', 'Sayuran segar rebus dengan bumbu kacang spesial, tahu, tempe, telur, dan kerupuk.', 'Makanan Berat', false, 65, 4.5),
  ('Bakso Beranak', 28000, 45, 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop&q=80', 'Bakso jumbo berisi bakso-bakso kecil di dalamnya, disajikan dengan mie kuning, bihun, dan kuah kaldu.', 'Makanan Berat', false, 72, 4.4),
  ('Pisang Goreng Keju', 15000, 80, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop&q=80', 'Pisang goreng crispy dengan taburan keju mozarella leleh dan saus cokelat.', 'Makanan Ringan', true, 110, 4.7),
  ('Martabak Manis Coklat', 35000, 25, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop&q=80', 'Martabak manis tebal dengan isian cokelat, keju, dan kacang. Empuk dan lembut.', 'Makanan Ringan', false, 89, 4.6),
  ('Es Teh Tarik', 12000, 100, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop&q=80', 'Teh tarik dingin dengan susu kental manis yang creamy. Sangat menyegarkan.', 'Minuman', false, 145, 4.5),
  ('Es Cendol', 10000, 90, 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&h=400&fit=crop&q=80', 'Es cendol tradisional dengan santan gurih, gula merah cair, dan es serut.', 'Minuman', false, 78, 4.4),
  ('Kopi Susu Gula Aren', 18000, 70, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop&q=80', 'Kopi robusta pilihan dicampur susu segar dan gula aren asli. Manis natural.', 'Minuman', true, 132, 4.8),
  ('Klepon Isi Gula Merah', 8000, 0, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop&q=80', 'Kue klepon pandan isi gula merah cair dengan taburan kelapa parut. Isi 6 buah.', 'Dessert', false, 45, 4.3),
  ('Sambal Matah', 15000, 55, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&h=400&fit=crop&q=80', 'Sambal matah khas Bali dengan bawang merah, serai, dan cabai rawit. Per botol 200ml.', 'Sambal & Bumbu', false, 56, 4.6),
  ('Es Krim Kelapa Muda', 14000, 40, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&h=400&fit=crop&q=80', 'Es krim homemade rasa kelapa muda dengan potongan daging kelapa asli.', 'Dessert', false, 63, 4.5);
