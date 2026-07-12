-- Migración para añadir columnas faltantes de la Base Maestra v2.0
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available_today BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS family TEXT;
