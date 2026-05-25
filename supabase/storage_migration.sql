-- ============================================
-- Migration: Setup Products Storage Bucket
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- 1. Insert a new public bucket named 'products'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view/read images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- 3. Allow authenticated users (like admin) to upload images
CREATE POLICY "Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

-- 4. Allow authenticated users to update/delete their images (optional)
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);
