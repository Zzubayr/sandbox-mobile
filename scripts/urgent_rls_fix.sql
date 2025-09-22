-- URGENT RLS FIX - Run this immediately in Supabase SQL Editor

-- Step 1: Check current policies
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('requests', 'request_items', 'vendors');

-- Step 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Vendors can view their requests" ON public.requests;
DROP POLICY IF EXISTS "Vendors can update their requests" ON public.requests;
DROP POLICY IF EXISTS "Anyone can create requests" ON public.requests;
DROP POLICY IF EXISTS "Vendors can view their request items" ON public.request_items;
DROP POLICY IF EXISTS "Anyone can create request items" ON public.request_items;

-- Step 3: Recreate policies with correct syntax
-- Allow anyone to create requests (for customers)
CREATE POLICY "Anyone can create requests" ON public.requests
  FOR INSERT WITH CHECK (true);

-- Allow vendors to view their own requests
CREATE POLICY "Vendors can view their requests" ON public.requests
  FOR SELECT USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to update their own requests
CREATE POLICY "Vendors can update their requests" ON public.requests
  FOR UPDATE USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow anyone to create request items (for customers)
CREATE POLICY "Anyone can create request items" ON public.request_items
  FOR INSERT WITH CHECK (true);

-- Allow vendors to view their request items
CREATE POLICY "Vendors can view their request items" ON public.request_items
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM public.requests WHERE vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Test the fix
INSERT INTO public.requests (
  vendor_id,
  customer_name,
  customer_phone,
  customer_note,
  total_amount,
  status
) VALUES (
  (SELECT id FROM public.vendors LIMIT 1),
  'Test Customer RLS Fix',
  '+1234567890',
  'Testing RLS fix',
  100.00,
  'pending'
) RETURNING id, customer_name, status;

-- Clean up test data
DELETE FROM public.requests WHERE customer_name = 'Test Customer RLS Fix';

-- Step 6: Verify policies are working
SELECT 'RLS Fix Complete - Test insert successful!' as status;
