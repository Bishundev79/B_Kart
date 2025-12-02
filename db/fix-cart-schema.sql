-- Fix cart_items and product_variants table schema mismatches
-- This adds the missing columns that are referenced in the API code

-- 1. Add price_at_add column to cart_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'price_at_add'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN price_at_add DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    COMMENT ON COLUMN cart_items.price_at_add IS 'Price of the product/variant at the time it was added to cart';
  END IF;
END $$;

-- 2. Add is_active column to product_variants if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    COMMENT ON COLUMN product_variants.is_active IS 'Whether this variant is currently available for purchase';
  END IF;
END $$;

-- Refresh the schema cache (Supabase PostgREST)
NOTIFY pgrst, 'reload schema';

-- Verify the columns were added
SELECT 'cart_items columns:' as table_info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
ORDER BY ordinal_position;

SELECT 'product_variants columns:' as table_info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
ORDER BY ordinal_position;
