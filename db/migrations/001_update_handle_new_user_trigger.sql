-- Migration: Update handle_new_user trigger for better OAuth support
-- Run this in Supabase SQL Editor to update the existing trigger
-- Date: 2025-12-01

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name_val TEXT;
  avatar_url_val TEXT;
  user_role user_role;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  
  -- Extract full name from various metadata sources
  -- OAuth providers use different keys (Google uses 'name', GitHub uses 'full_name')
  full_name_val := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.email, '@', 1),  -- Fallback to email username
    'User'
  );
  
  -- Extract avatar URL from various metadata sources
  -- Google uses 'picture', GitHub uses 'avatar_url'
  avatar_url_val := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'photo',
    NULL
  );

  -- Get role from metadata, default to 'customer'
  -- Email/password signups will have role in metadata
  -- OAuth signups default to 'customer' (can be changed later)
  BEGIN
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'customer'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    user_role := 'customer'::user_role;
  END;

  -- Insert profile
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
      NEW.id,
      full_name_val,
      avatar_url_val,
      user_role
    );
    
    RAISE LOG 'Profile created for user % with role %', NEW.id, user_role;
  EXCEPTION WHEN unique_violation THEN
    -- Profile already exists (race condition), update it instead
    UPDATE public.profiles
    SET 
      full_name = COALESCE(full_name, full_name_val),
      avatar_url = COALESCE(avatar_url, avatar_url_val),
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE LOG 'Profile already exists for user %, updated instead', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify trigger was created
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
