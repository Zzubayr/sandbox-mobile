# 🔧 RLS Policy Fix Guide

## Issue
You're getting this error when trying to create a request:
```
Error creating request: 
{
  code: "42501",
  details: null,
  hint: null,
  message: "new row violates row-level security policy for table \"requests\""
}
```

## Root Cause
The Row Level Security (RLS) policies for the `requests` table are not properly configured to allow anonymous users (customers) to create requests.

## Solution

### Step 1: Run the RLS Fix Script
Execute the SQL script in your Supabase SQL Editor:

```sql
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
```

### Step 2: Verify Policies
After running the script, verify the policies are created correctly:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('requests', 'request_items')
ORDER BY tablename, policyname;
```

You should see these policies:
- `Anyone can create requests` (INSERT)
- `Vendors can view their requests` (SELECT)
- `Vendors can update their requests` (UPDATE)
- `Anyone can create request items` (INSERT)
- `Vendors can view their request items` (SELECT)

### Step 3: Test the Fix
1. Go to your storefront
2. Add items to cart
3. Proceed to checkout
4. Fill out the form and submit
5. You should see a success toast and be redirected to the success page

## Alternative Solution (If Above Doesn't Work)

If the above doesn't work, you can temporarily disable RLS for testing:

```sql
-- TEMPORARY: Disable RLS for requests table (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: Only use this for testing. Re-enable RLS in production:

```sql
-- Re-enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;
```

## What Was Fixed

1. **Toast Notifications**: Added proper success/error feedback to the checkout process
2. **RLS Policies**: Ensured anonymous users can create requests
3. **Error Handling**: Better error messages for debugging

## Security Considerations

The policies allow:
- ✅ Anonymous users to create requests (customers)
- ✅ Vendors to view their own requests
- ✅ Vendors to update their own requests
- ❌ Anonymous users to view other vendors' requests
- ❌ Anonymous users to update requests

This maintains security while allowing the checkout flow to work properly.

## Testing Checklist

- [ ] Run the RLS fix script
- [ ] Verify policies are created
- [ ] Test checkout flow as anonymous user
- [ ] Test vendor can view their requests
- [ ] Test vendor can update request status
- [ ] Verify toast notifications work
- [ ] Test error handling

## If Issues Persist

1. Check Supabase logs for detailed error messages
2. Verify the user is not authenticated (should be anonymous)
3. Check if there are any conflicting policies
4. Ensure the `requests` table structure matches the expected schema

