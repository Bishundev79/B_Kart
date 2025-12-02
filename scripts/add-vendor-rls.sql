-- Add RLS policy for vendors table to allow public read access for approved vendors
CREATE POLICY "Approved vendors are viewable by everyone" 
ON vendors 
FOR SELECT 
USING (status = 'approved');

-- Allow vendors to view and update their own profile
CREATE POLICY "Vendors can view own profile" 
ON vendors 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Vendors can update own profile" 
ON vendors 
FOR UPDATE 
USING (user_id = auth.uid());

-- Allow admins to manage all vendors
CREATE POLICY "Admins can manage all vendors" 
ON vendors 
FOR ALL 
USING (is_admin());
