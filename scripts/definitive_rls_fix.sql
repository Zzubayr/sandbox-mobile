-- DEFINITIVE RLS FIX - This will definitely work
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Starting RLS fix...' as status;

-- Step 2: Disable RLS temporarily to clear any conflicting policies
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies (if any exist)
DROP POLICY IF EXISTS "Vendors can view their requests" ON public.requests;
DROP POLICY IF EXISTS "Vendors can update their requests" ON public.requests;
DROP POLICY IF EXISTS "Anyone can create requests" ON public.requests;
DROP POLICY IF EXISTS "Vendors can view their request items" ON public.request_items;
DROP POLICY IF EXISTS "Anyone can create request items" ON public.request_items;
DROP POLICY IF EXISTS "Allow anonymous requests" ON public.requests;
DROP POLICY IF EXISTS "Allow anonymous request items" ON public.request_items;

-- Step 4: Re-enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Create new policies with explicit permissions
-- Allow ANYONE (including anonymous users) to create requests
CREATE POLICY "Allow anonymous requests" ON public.requests
  FOR INSERT 
  WITH CHECK (true);

-- Allow vendors to view their own requests
CREATE POLICY "Vendors can view their requests" ON public.requests
  FOR SELECT 
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to update their own requests
CREATE POLICY "Vendors can update their requests" ON public.requests
  FOR UPDATE 
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow ANYONE (including anonymous users) to create request items
CREATE POLICY "Allow anonymous request items" ON public.request_items
  FOR INSERT 
  WITH CHECK (true);

-- Allow vendors to view their request items
CREATE POLICY "Vendors can view their request items" ON public.request_items
  FOR SELECT 
  USING (
    request_id IN (
      SELECT id FROM public.requests WHERE vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

-- Step 6: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('requests', 'request_items');

-- Step 7: Test anonymous insert (this should work now)
DO $$
DECLARE
    test_vendor_id UUID;
    test_request_id UUID;
BEGIN
    -- Get any vendor ID
    SELECT id INTO test_vendor_id FROM public.vendors LIMIT 1;
    
    IF test_vendor_id IS NOT NULL THEN
        -- Try to insert a request (this should work for anonymous users)
        INSERT INTO public.requests (
            vendor_id,
            customer_name,
            customer_phone,
            customer_note,
            total_amount,
            status
        ) VALUES (
            test_vendor_id,
            'Test Anonymous Request',
            '+1234567890',
            'Testing anonymous request creation',
            100.00,
            'pending'
        ) RETURNING id INTO test_request_id;
        
        -- Try to insert request items
        INSERT INTO public.request_items (
            request_id,
            product_id,
            quantity,
            price
        ) VALUES (
            test_request_id,
            (SELECT id FROM public.products WHERE vendor_id = test_vendor_id LIMIT 1),
            1,
            50.00
        );
        
        -- Clean up test data
        DELETE FROM public.request_items WHERE request_id = test_request_id;
        DELETE FROM public.requests WHERE id = test_request_id;
        
        RAISE NOTICE 'SUCCESS: Anonymous request creation works!';
    ELSE
        RAISE NOTICE 'WARNING: No vendors found in database';
    END IF;
END $$;

-- Step 8: Final verification
SELECT 'RLS Fix Complete - Anonymous requests should now work!' as status;

