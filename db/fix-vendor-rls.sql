-- ============================================
-- FIX: Add Missing Vendor RLS Policies
-- Execute this in Supabase SQL Editor
-- ============================================

-- This fixes the issue where products are not displaying
-- because anonymous users cannot access vendor data

-- Allow anonymous users to view approved vendors (needed for product listings)
CREATE POLICY "Approved vendors are viewable by everyone" 
ON vendors 
FOR SELECT 
USING (status = 'approved');

-- Allow vendors to view their own profile (even if pending/suspended)
CREATE POLICY "Vendors can view own profile" 
ON vendors 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow vendors to update their own profile
CREATE POLICY "Vendors can update own profile" 
ON vendors 
FOR UPDATE 
USING (user_id = auth.uid());

-- Allow admins full access to vendors
CREATE POLICY "Admins can manage all vendors" 
ON vendors 
FOR ALL 
USING (is_admin());

-- ============================================
-- Verification Query
-- ============================================

-- After running the above, verify policies exist:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'vendors';

-- Expected: 4 policies should be listed
