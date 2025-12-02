# Database Migrations

This directory contains database migrations for the B_Kart platform.

## Directory Structure

```
migrations/
├── up/           # Forward migrations (apply changes)
├── down/         # Rollback migrations (undo changes)
└── *.sql         # Legacy migrations (kept for reference)
```

## Naming Convention

Migrations use timestamp prefixes for ordering:

```
YYYYMMDDHHMMSS_description.sql
```

Examples:
- `00000000000000_migration_tracking.sql` - Migration infrastructure
- `20241201000001_initial_schema.sql` - Initial schema
- `20241201120000_add_product_weight.sql` - Add column migration

## Running Migrations

### Using Supabase Dashboard

1. Go to SQL Editor
2. Run migrations in order from `up/` directory
3. Record which migrations are applied

### Using Supabase CLI

```bash
# Run a specific migration
supabase db execute --file db/migrations/up/20241201000001_initial_schema.sql
```

## Creating Migrations

1. Create a timestamped file in `up/`:
   ```sql
   -- migrations/up/20241201120000_add_feature.sql
   DO $$
   BEGIN
     IF NOT migration_applied('20241201120000_add_feature') THEN
       -- Your changes here
       ALTER TABLE products ADD COLUMN new_field TEXT;
       
       PERFORM record_migration('20241201120000_add_feature');
     END IF;
   END $$;
   ```

2. Create corresponding rollback in `down/`:
   ```sql
   -- migrations/down/20241201120000_add_feature.sql
   ALTER TABLE products DROP COLUMN IF EXISTS new_field;
   SELECT remove_migration('20241201120000_add_feature');
   ```

## Migration Tracking

The `_migrations` table tracks applied migrations:

```sql
-- Check applied migrations
SELECT * FROM _migrations ORDER BY applied_at;

-- Check if specific migration applied
SELECT migration_applied('20241201000001_initial_schema');
```

## Rolling Back

```bash
# Run the corresponding down migration
supabase db execute --file db/migrations/down/20241201000001_initial_schema.sql
```

## Best Practices

1. **Make migrations idempotent** - Use `IF NOT EXISTS`, `IF EXISTS`
2. **Keep migrations small** - One logical change per migration
3. **Always create rollback** - Ensure down migration undoes up
4. **Test in development** - Never run untested migrations in production
5. **Don't modify applied migrations** - Create new migrations for fixes

## Legacy Migrations

The root `migrations/` folder contains legacy migrations from earlier development:
- `001_update_handle_new_user_trigger.sql`
- `20251129_create_coupons.sql`
- `20251129_add_coupon_to_orders.sql`
- `20251129_increment_coupon_usage.sql`

These are kept for reference but new migrations should use the `up/` and `down/` structure.
