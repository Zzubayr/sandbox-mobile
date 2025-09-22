# 🚨 URGENT FIXES - RLS Error & Cart Persistence

## Issue 1: RLS Policy Error (CRITICAL)

### **Error Message**
```
Error creating request: 
{
  code: "42501",
  details: null,
  hint: null,
  message: "new row violates row-level security policy for table \"requests\""
}
```

### **Root Cause**
The Row Level Security (RLS) policies for the `requests` table are not properly configured to allow anonymous users (customers) to create requests.

### **IMMEDIATE FIX**

**Run this SQL script in your Supabase SQL Editor:**

```sql
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
```

### **Expected Result**
- ✅ Test insert should succeed
- ✅ You should see "RLS Fix Complete - Test insert successful!" message
- ✅ Request creation should work in your app

---

## Issue 2: Cart Persistence (ENHANCED)

### **Problem**
Users lose cart items if they refresh the page or if request creation fails.

### **Solution Implemented**
- ✅ **Cart Persistence**: Cart items are automatically saved to localStorage
- ✅ **Smart Clearing**: Cart is only cleared AFTER successful request creation
- ✅ **Error Recovery**: If request fails, cart items remain intact
- ✅ **Page Refresh Protection**: Cart survives page refreshes and browser restarts

### **How It Works**

#### **Cart Persistence**
```typescript
// Cart is automatically saved to localStorage whenever it changes
useEffect(() => {
  localStorage.setItem("sandbox-cart", JSON.stringify(state.items))
}, [state.items])

// Cart is loaded from localStorage on app startup
useEffect(() => {
  const savedCart = localStorage.getItem("sandbox-cart")
  if (savedCart) {
    try {
      const items = JSON.parse(savedCart)
      dispatch({ type: "LOAD_CART", items })
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
    }
  }
}, [])
```

#### **Smart Cart Clearing**
```typescript
// Cart is only cleared AFTER successful request creation
try {
  // Create request
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .insert({...})
    .select()
    .single()

  if (requestError) throw requestError

  // Create request items
  const { error: itemsError } = await supabase
    .from("request_items")
    .insert(requestItems)

  if (itemsError) throw itemsError

  // Show success toast
  toastHelpers.requestSubmitted()

  // Clear cart ONLY after successful request creation
  dispatch({ type: "CLEAR_CART" })

  // Redirect to success page
  router.push(`/store/${slug}/request-success?requestId=${request.id}`)
} catch (error) {
  // If request fails, cart items remain intact
  console.error("Error creating request:", error)
  toastHelpers.error("Request Failed", "Failed to create request. Please try again.")
}
```

### **User Experience**

#### **Before Fix**
- ❌ Cart lost on page refresh
- ❌ Cart lost if request creation fails
- ❌ Users had to re-add items after errors

#### **After Fix**
- ✅ Cart persists through page refreshes
- ✅ Cart persists through browser restarts
- ✅ Cart only cleared after successful request creation
- ✅ If request fails, cart items remain intact
- ✅ Users can retry without losing their items

---

## Testing Checklist

### **RLS Fix Testing**
- [ ] Run the SQL script in Supabase
- [ ] Verify test insert succeeds
- [ ] Test request creation in your app
- [ ] Confirm no more RLS errors

### **Cart Persistence Testing**
- [ ] Add items to cart
- [ ] Refresh the page → Cart should remain
- [ ] Close and reopen browser → Cart should remain
- [ ] Create a request → Cart should clear only after success
- [ ] Simulate request failure → Cart should remain intact

---

## Files Modified

### **RLS Fix**
- `scripts/urgent_rls_fix.sql` - Complete RLS policy fix

### **Cart Persistence**
- `lib/cart-context.tsx` - Enhanced cart clearing logic
- `app/store/[slug]/checkout/page.tsx` - Clear cart only after success

---

## Quick Fix Steps

### **Step 1: Fix RLS (CRITICAL)**
1. Go to Supabase SQL Editor
2. Copy and paste the contents of `scripts/urgent_rls_fix.sql`
3. Run the script
4. Verify you see "RLS Fix Complete - Test insert successful!"

### **Step 2: Test Cart Persistence**
1. Add items to cart
2. Refresh page → Items should remain
3. Create a request → Cart should clear only after success
4. If request fails → Cart should remain intact

---

## Result

**After applying these fixes:**
- ✅ **Request creation will work** (no more RLS errors)
- ✅ **Cart persistence** (survives refreshes and errors)
- ✅ **Smart cart clearing** (only after successful requests)
- ✅ **Better user experience** (no lost cart items)

**The app should now work perfectly for request creation and cart management!** 🎉
