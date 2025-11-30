-- Create coupons table
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FLAT');

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_value DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2), -- Useful for percentage discounts
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active_dates ON coupons(is_active, starts_at, expires_at);

-- Trigger to update updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on coupons"
  ON coupons
  FOR ALL
  USING (is_admin());

-- Public can read active coupons (for validation)
-- Note: We might want to restrict this to only specific columns via API, 
-- but for RLS, allowing read on active coupons is generally okay if we don't expose sensitive info.
-- However, to prevent scraping, we might want to keep RLS strict and use a secure function or admin-only API that the public endpoint calls.
-- For simplicity in this portfolio project, we'll allow public read of active coupons.
CREATE POLICY "Public can read active coupons"
  ON coupons
  FOR SELECT
  USING (is_active = true AND starts_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW()));
