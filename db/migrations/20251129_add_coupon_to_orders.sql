-- Add coupon fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
