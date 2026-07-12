-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available_today BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promotion_text TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS family TEXT;

-- Temporarily allow anon role to interact with tables because the app does not use Supabase Auth JWTs
DROP POLICY IF EXISTS "Products viewable by anyone authenticated" ON public.products;
DROP POLICY IF EXISTS "Products writeable by admin/manager" ON public.products;
CREATE POLICY "Products access" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Product prices viewable by anyone authenticated" ON public.product_prices;
DROP POLICY IF EXISTS "Product prices writeable by admin/manager" ON public.product_prices;
CREATE POLICY "Product prices access" ON public.product_prices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Ingredients viewable by anyone authenticated" ON public.ingredients;
DROP POLICY IF EXISTS "Ingredients editable by admin/manager" ON public.ingredients;
CREATE POLICY "Ingredients access" ON public.ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Recipes viewable by anyone authenticated" ON public.recipes;
DROP POLICY IF EXISTS "Recipes editable by admin/manager" ON public.recipes;
CREATE POLICY "Recipes access" ON public.recipes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Orders viewable by anyone authenticated" ON public.orders;
DROP POLICY IF EXISTS "Orders writeable by any cashier/admin/manager" ON public.orders;
CREATE POLICY "Orders access" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Order items viewable by anyone authenticated" ON public.order_items;
DROP POLICY IF EXISTS "Order items writeable by authenticated staff" ON public.order_items;
CREATE POLICY "Order items access" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Notify schema change
NOTIFY pgrst, 'reload schema';
