-- 1. Create missing tables if they don't exist

CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  initial_cash DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  expected_cash DECIMAL(10,2),
  actual_cash DECIMAL(10,2),
  cash_difference DECIMAL(10,2),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id UUID NOT NULL REFERENCES public.cash_registers(id),
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  provider TEXT,
  invoice_number TEXT,
  notes TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Configure permissive policies (so the app works without JWT claims)
-- Since the app relies heavily on anon requests and local UI roles, we keep policies open for authenticated and anon users but rely on application layer security.

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Access %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Access %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
