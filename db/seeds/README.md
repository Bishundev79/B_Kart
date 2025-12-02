# Database Seeds

This directory contains SQL seed files for populating the database with test data during development.

## Files

| File | Description | Idempotent |
|------|-------------|------------|
| `00_seed_data.sql` | Comprehensive seed data (categories, settings, coupons) | ✅ |
| `01_categories.sql` | Legacy category seeds | ✅ |
| `02_products.sql` | Sample product template (requires vendor ID) | ❌ |

## Quick Start

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the seed file contents
4. Execute the SQL

### Using Supabase CLI

```bash
# Run comprehensive seed data
supabase db execute --file db/seeds/00_seed_data.sql
```

## Seed Order

1. **Run schema first**: `db/schemas/00_core_schema.sql`
2. **Run RLS policies**: `db/policies/01_rls_policies.sql`
3. **Run functions**: `db/functions/02_business_functions.sql`
4. **Run seed data**: `db/seeds/00_seed_data.sql`

## What's Included

### Categories (40+)
- 8 main categories (Electronics, Fashion, Home & Garden, etc.)
- 30+ subcategories with proper hierarchy

### Platform Settings (25+)
- Commerce settings (commission rates, currency)
- Shipping settings (thresholds, costs)
- Feature flags (reviews, wishlist, coupons)

### Coupons (5)
- WELCOME10 - 10% off for new customers
- SAVE20 - $20 off orders over $100
- FREESHIP - Free shipping
- SUMMER25 - 25% off summer sale
- FLASH50 - 50% flash sale (limited)

## Creating Test Users

Users must be created through the application to integrate with Supabase Auth:

1. **Customer**: Sign up at `/signup` with role "customer"
2. **Vendor**: Sign up at `/signup` with role "vendor", then complete onboarding
3. **Admin**: Update role in database:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';
```

## Creating Test Products

After creating a vendor, use this template:

```sql
-- Get your vendor ID
SELECT id, store_name FROM vendors WHERE user_id = auth.uid();

-- Insert a product
INSERT INTO products (
  vendor_id, category_id, name, slug, description,
  price, quantity, status
) VALUES (
  'YOUR_VENDOR_ID',
  '00000000-0000-0000-0002-000000000001', -- Smartphones category
  'Test Product',
  'test-product',
  'A test product description',
  99.99,
  100,
  'active'
);
```

## Resetting Seed Data

To clear and re-seed:

```sql
-- Clear specific tables (preserves users)
TRUNCATE categories, coupons, platform_settings CASCADE;

-- Re-run seeds
-- Execute db/seeds/00_seed_data.sql
```

## Notes

- Seed data uses deterministic UUIDs for relationships
- ON CONFLICT clauses ensure idempotent execution
- Products and orders should be created via the app
- Never run seeds in production!
