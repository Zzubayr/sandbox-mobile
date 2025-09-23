-- Test RLS policies for requests table (Fixed Version)
-- Run this to verify the policies are working correctly

-- Test 1: Check if policies exist (Alternative method)
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  pol.polname as policy_name,
  pol.polpermissive as permissive,
  pol.polroles as roles,
  pol.polcmd as command,
  pol.polqual as qual,
  pol.polwithcheck as with_check
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('requests', 'request_items')
ORDER BY c.relname, pol.polname;

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

-- Test 4: Simple test to see if we can select from requests table
SELECT COUNT(*) as total_requests FROM public.requests;

-- Test 5: Check if we can select from request_items table
SELECT COUNT(*) as total_request_items FROM public.request_items;

-- Test 6: Check vendor table structure (needed for the policies)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vendors' 
ORDER BY ordinal_position;

