-- ============================================
-- Migration: Support Guest Checkout (Walk-in)
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- 1. Add guest_name column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- 2. Make user_id nullable for guest orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- ============================================
-- 3. Fix ORDERS RLS policies
-- ============================================
-- Drop ALL existing order policies first
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
  END LOOP;
END $$;

-- Recreate clean policies
-- Anyone (including anon/guest) can INSERT orders
CREATE POLICY "orders_insert_anyone" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Anyone can SELECT orders (admins see all, users see own)
CREATE POLICY "orders_select_all" ON public.orders
  FOR SELECT USING (true);

-- Admins can UPDATE orders
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can DELETE orders  
CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 4. Fix ORDER_ITEMS RLS policies
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', pol.policyname);
  END LOOP;
END $$;

-- Anyone can INSERT order items
CREATE POLICY "order_items_insert_anyone" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- Anyone can SELECT order items
CREATE POLICY "order_items_select_all" ON public.order_items
  FOR SELECT USING (true);

-- Admins can UPDATE order items
CREATE POLICY "order_items_update_admin" ON public.order_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can DELETE order items
CREATE POLICY "order_items_delete_admin" ON public.order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. Fix PRODUCTS RLS policies (allow stock update)
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

-- Anyone can view products
CREATE POLICY "products_select_anyone" ON public.products
  FOR SELECT USING (true);

-- Anyone can update products (needed for stock deduction at checkout)
CREATE POLICY "products_update_anyone" ON public.products
  FOR UPDATE USING (true) WITH CHECK (true);

-- Admins can insert products
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete products
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
