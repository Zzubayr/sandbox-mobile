-- Test RLS policies for requests table
-- Run this to verify the policies are working correctly

-- Test 1: Check if policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('requests', 'request_items')
ORDER BY tablename, policyname;

-- Test 2: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('requests', 'request_items');

-- Test 3: Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
ORDER BY ordinal_position;

-- Test 4: Check if we can insert a test request (this should work for anonymous users)
-- Note: This will only work if the policies are correctly set up
INSERT INTO public.requests (
  vendor_id,
  customer_name,
  customer_phone,
  customer_note,
  total_amount,
  status
) VALUES (
  (SELECT id FROM public.vendors LIMIT 1), -- Get any vendor ID
  'Test Customer',
  '+1234567890',
  'Test request',
  100.00,
  'pending'
) RETURNING id;

-- Clean up test data
DELETE FROM public.requests WHERE customer_name = 'Test Customer';

