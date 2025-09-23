-- Create Admin System Database Schema
-- This script creates the admin system with vendor approval functionality

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Update vendors table with approval fields
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 3. Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing vendor policies
DROP POLICY IF EXISTS "Vendors can view their own data" ON public.vendors;
DROP POLICY IF EXISTS "Anyone can view active vendors" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can insert their own data" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update their own data" ON public.vendors;

-- 5. Create new vendor policies with admin access
CREATE POLICY "Vendors can view their own data" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vendors" ON public.vendors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view approved active vendors" ON public.vendors
  FOR SELECT USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Vendors can insert their own data" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own data" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors" ON public.vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );

-- 6. Create admin policies
CREATE POLICY "Admins can view all admin records" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage admin records" ON public.admins
  FOR ALL USING (auth.uid() = user_id);

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.admins TO authenticated;

-- 8. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = is_admin.user_id
  );
END;
$$;

-- 9. Create function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role
  FROM public.admins 
  WHERE admins.user_id = get_admin_role.user_id;
  
  RETURN admin_role;
END;
$$;

-- 10. Create function to approve vendor
CREATE OR REPLACE FUNCTION public.approve_vendor(
  vendor_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update vendor approval status
  UPDATE public.vendors 
  SET 
    approval_status = 'approved',
    admin_notes = approve_vendor.admin_notes,
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = vendor_id;

  RETURN FOUND;
END;
$$;

-- 11. Create function to reject vendor
CREATE OR REPLACE FUNCTION public.reject_vendor(
  vendor_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update vendor approval status
  UPDATE public.vendors 
  SET 
    approval_status = 'rejected',
    admin_notes = reject_vendor.admin_notes,
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = vendor_id;

  RETURN FOUND;
END;
$$;

-- 12. Create function to delete vendor and all related data
CREATE OR REPLACE FUNCTION public.delete_vendor_cascade(vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Delete vendor (this will cascade to all related data due to foreign key constraints)
  DELETE FROM public.vendors WHERE id = vendor_id;

  RETURN FOUND;
END;
$$;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_approval_status ON public.vendors(approval_status);
CREATE INDEX IF NOT EXISTS idx_vendors_approved_by ON public.vendors(approved_by);
CREATE INDEX IF NOT EXISTS idx_vendors_approved_at ON public.vendors(approved_at);

-- 14. Update existing vendors to have 'approved' status (for existing system)
UPDATE public.vendors 
SET approval_status = 'approved' 
WHERE approval_status = 'pending' AND is_active = true;

-- 15. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Add comments for documentation
COMMENT ON TABLE public.admins IS 'Admin users who can manage vendors and system settings';
COMMENT ON COLUMN public.admins.role IS 'Admin role: admin or super_admin';
COMMENT ON COLUMN public.admins.permissions IS 'JSON object containing specific permissions';

COMMENT ON COLUMN public.vendors.approval_status IS 'Vendor approval status: pending, approved, or rejected';
COMMENT ON COLUMN public.vendors.admin_notes IS 'Notes from admin about vendor approval/rejection';
COMMENT ON COLUMN public.vendors.approved_by IS 'User ID of admin who approved/rejected the vendor';
COMMENT ON COLUMN public.vendors.approved_at IS 'Timestamp when vendor was approved/rejected';
