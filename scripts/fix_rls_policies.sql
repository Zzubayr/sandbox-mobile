-- Fix RLS policies for requests table
-- This script ensures customers can create requests and vendors can manage them

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Vendors can view their requests" ON public.requests;
DROP POLICY IF EXISTS "Vendors can update their requests" ON public.requests;
DROP POLICY IF EXISTS "Anyone can create requests" ON public.requests;
DROP POLICY IF EXISTS "Vendors can view their request items" ON public.request_items;
DROP POLICY IF EXISTS "Anyone can create request items" ON public.request_items;

-- Recreate requests policies
CREATE POLICY "Vendors can view their requests" ON public.requests
  FOR SELECT USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their requests" ON public.requests
  FOR UPDATE USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow anyone (including anonymous users) to create requests
CREATE POLICY "Anyone can create requests" ON public.requests
  FOR INSERT WITH CHECK (true);

-- Recreate request_items policies
CREATE POLICY "Vendors can view their request items" ON public.request_items
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM public.requests WHERE vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

-- Allow anyone (including anonymous users) to create request items
CREATE POLICY "Anyone can create request items" ON public.request_items
  FOR INSERT WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('requests', 'request_items')
ORDER BY tablename, policyname;

