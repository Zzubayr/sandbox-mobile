-- Simple RLS Test - Run this first to check basic functionality

-- Test 1: Check if tables exist and RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('requests', 'request_items', 'vendors');

-- Test 2: Check if we can read from requests table
SELECT COUNT(*) as total_requests FROM public.requests;

-- Test 3: Check if we can read from request_items table  
SELECT COUNT(*) as total_request_items FROM public.request_items;

-- Test 4: Check if we can read from vendors table
SELECT COUNT(*) as total_vendors FROM public.vendors;

-- Test 5: Try to insert a test request (this should work if policies are correct)
-- Note: This will only work if you have a valid vendor_id
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
  'Test request for RLS verification',
  100.00,
  'pending'
) RETURNING id, customer_name, status;

-- Clean up test data
DELETE FROM public.requests WHERE customer_name = 'Test Customer';

