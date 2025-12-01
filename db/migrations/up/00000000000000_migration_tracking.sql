-- Migration: Create migration tracking table
-- Description: Tracks applied database migrations for idempotent execution
-- Created: Initial setup
-- Supabase/PostgreSQL 15+ compatible

-- ============================================
-- MIGRATION TRACKING TABLE
-- ============================================

-- This table records all applied migrations to ensure idempotent execution
-- Migrations can be run multiple times safely - already applied ones are skipped

CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT,
  execution_time_ms INTEGER,
  applied_by TEXT DEFAULT current_user
);

-- Comment on table and columns for documentation
COMMENT ON TABLE _migrations IS 'Tracks database migrations for idempotent execution';
COMMENT ON COLUMN _migrations.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN _migrations.name IS 'Migration filename/identifier (must be unique)';
COMMENT ON COLUMN _migrations.applied_at IS 'Timestamp when migration was applied';
COMMENT ON COLUMN _migrations.checksum IS 'MD5 hash of migration content for drift detection';
COMMENT ON COLUMN _migrations.execution_time_ms IS 'Time taken to execute the migration in milliseconds';
COMMENT ON COLUMN _migrations.applied_by IS 'Database user who applied the migration';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migrations_name ON _migrations(name);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON _migrations(applied_at DESC);

-- Function to check if a migration has been applied
CREATE OR REPLACE FUNCTION migration_applied(migration_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM _migrations WHERE name = migration_name);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION migration_applied IS 'Checks if a migration has already been applied';

-- Function to record a migration
CREATE OR REPLACE FUNCTION record_migration(
  migration_name TEXT,
  migration_checksum TEXT DEFAULT NULL,
  exec_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO _migrations (name, checksum, execution_time_ms)
  VALUES (migration_name, migration_checksum, exec_time_ms)
  ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_migration IS 'Records a migration as applied (idempotent)';

-- Function to remove a migration record (for rollback)
CREATE OR REPLACE FUNCTION remove_migration(migration_name TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM _migrations WHERE name = migration_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_migration IS 'Removes a migration record for rollback purposes';

-- Record this migration
SELECT record_migration('00000000000000_migration_tracking');
