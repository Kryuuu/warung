-- 0. Ensure stock cannot be negative (idempotent)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_check;
ALTER TABLE public.products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

-- 1. Function to decrement stock when order_items are inserted
CREATE OR REPLACE FUNCTION public.handle_stock_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce stock from the products table
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to restore stock when orders are cancelled
CREATE OR REPLACE FUNCTION public.handle_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only if status changes from 'pending'/'processed' to 'cancelled'
  IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
    UPDATE public.products p
    SET stock = p.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for new order items (decrement)
DROP TRIGGER IF EXISTS tr_decrement_stock ON public.order_items;
CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_stock_on_insert();

-- 4. Trigger for order status changes (restore if cancelled)
DROP TRIGGER IF EXISTS tr_restore_stock_on_cancel ON public.orders;
CREATE TRIGGER tr_restore_stock_on_cancel
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_stock_on_cancel();
