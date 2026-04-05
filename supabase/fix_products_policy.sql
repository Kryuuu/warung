-- 0. Ensure the products table uses UUIDs and has sane defaults
-- ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid(); -- Uncomment if ID is not automatic
ALTER TABLE public.products ALTER COLUMN is_featured SET DEFAULT false;
ALTER TABLE public.products ALTER COLUMN order_count SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN rating SET DEFAULT 5;
ALTER TABLE public.products ALTER COLUMN stock SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN image_url SET DEFAULT 'https://placehold.co/600x400/f3efe8/b44712?text=Produk+Baru';

-- 2. Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- 4. Create proper policies
-- Anyone (even unauthenticated) can view products
CREATE POLICY "Anyone can view products" ON public.products
FOR SELECT USING (true);

-- Only authenticated users with 'admin' role can manage products (Insert, Update, Delete)
CREATE POLICY "Admins can manage products" ON public.products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
