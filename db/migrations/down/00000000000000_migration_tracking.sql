-- Rollback: Migration tracking table
-- WARNING: This will remove all migration history

DROP FUNCTION IF EXISTS remove_migration(TEXT);
DROP FUNCTION IF EXISTS record_migration(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS migration_applied(TEXT);
DROP INDEX IF EXISTS idx_migrations_applied_at;
DROP INDEX IF EXISTS idx_migrations_name;
DROP TABLE IF EXISTS _migrations;
