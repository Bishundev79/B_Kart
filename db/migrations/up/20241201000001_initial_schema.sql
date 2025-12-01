-- Migration: Initial schema creation
-- Description: Creates all tables, indexes, constraints, and triggers
-- Created: 2024-12-01
-- Supabase/PostgreSQL 15+ compatible
--
-- This migration creates the complete B_Kart database schema
-- It is idempotent and can be run multiple times safely

DO $$
BEGIN
  -- Check if migration already applied
  IF migration_applied('20241201000001_initial_schema') THEN
    RAISE NOTICE 'Migration 20241201000001_initial_schema already applied, skipping';
    RETURN;
  END IF;

  -- The actual schema is in schemas/00_core_schema.sql
  -- This migration file serves as a tracking record
  
  PERFORM record_migration('20241201000001_initial_schema');
  RAISE NOTICE 'Migration 20241201000001_initial_schema applied successfully';
END $$;
