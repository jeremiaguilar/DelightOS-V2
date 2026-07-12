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
  type TEXT NOT NULL, -- 'IN' or 'OUT'
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  type TEXT NOT NULL, -- 'IN' (Purchase), 'OUT' (Waste), 'ADJUST'
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
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  user_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Basic Policies
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cash Registers access" ON public.cash_registers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cash Movements access" ON public.cash_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory Movements access" ON public.inventory_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit Logs access" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
