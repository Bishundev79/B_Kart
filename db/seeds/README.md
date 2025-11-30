# Database Seeds

This directory contains SQL seed files for populating the database with test data during development.

## Files

| File | Description |
|------|-------------|
| `01_categories.sql` | Product categories and subcategories |
| `02_products.sql` | Sample products (template - requires vendor ID) |

## Running Seeds

### Prerequisites

1. Ensure your Supabase project is set up
2. Run the main schema first: `db/schema.sql`
3. Run RLS policies: `db/rls_policies.sql`
4. Run functions: `db/functions.sql`

### Running via Supabase CLI

```bash
# Navigate to project root
cd /path/to/B_Kart

# Run categories seed
supabase db execute --file db/seeds/01_categories.sql

# For products, first create a vendor account through the app,
# then modify and run the products seed
```

### Running via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the seed file contents
4. Execute the SQL

## Creating Test Users

For testing, you'll need to create users through the application:

1. **Customer Account**: Sign up at `/signup` with role "customer"
2. **Vendor Account**: Sign up at `/signup` with role "vendor", then complete onboarding at `/onboarding`
3. **Admin Account**: Update a user's role in the database directly:

```sql
-- Make a user an admin (replace USER_ID)
UPDATE profiles SET role = 'admin' WHERE id = 'USER_ID';
```

## Order of Operations

1. Create database schema
2. Apply RLS policies
3. Create database functions
4. **Run category seeds**
5. Create test users via app
6. Complete vendor onboarding
7. **Run product seeds** (with actual vendor ID)

## Notes

- Category IDs use readable identifiers (e.g., 'cat_electronics') for easier reference
- Product seed file is a template - you need to replace `VENDOR_ID` with an actual vendor UUID
- Always test on development database first
- These seeds are for development only - production should start with an empty database
