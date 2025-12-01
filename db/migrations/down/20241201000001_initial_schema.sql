-- Rollback: Initial schema
-- WARNING: This will drop all tables and data!

-- Note: Full rollback requires manual intervention due to 
-- cascading dependencies. This is intentionally incomplete
-- to prevent accidental data loss.

-- To fully reset, use Supabase Dashboard or:
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

SELECT remove_migration('20241201000001_initial_schema');
