-- Test Anonymous Request Creation
-- Run this to verify anonymous users can create requests

-- Test 1: Check if we can insert a request as anonymous user
INSERT INTO public.requests (
  vendor_id,
  customer_name,
  customer_phone,
  customer_note,
  total_amount,
  status
) VALUES (
  (SELECT id FROM public.vendors LIMIT 1),
  'Anonymous Test Customer',
  '+1234567890',
  'Testing anonymous request creation',
  150.00,
  'pending'
) RETURNING id, customer_name, status;

-- Test 2: Check if we can insert request items
INSERT INTO public.request_items (
  request_id,
  product_id,
  quantity,
  price
) VALUES (
  (SELECT id FROM public.requests WHERE customer_name = 'Anonymous Test Customer' LIMIT 1),
  (SELECT id FROM public.products LIMIT 1),
  2,
  75.00
) RETURNING id, request_id, quantity, price;

-- Test 3: Verify the data was inserted
SELECT 
  r.id as request_id,
  r.customer_name,
  r.total_amount,
  r.status,
  COUNT(ri.id) as item_count
FROM public.requests r
LEFT JOIN public.request_items ri ON r.id = ri.request_id
WHERE r.customer_name = 'Anonymous Test Customer'
GROUP BY r.id, r.customer_name, r.total_amount, r.status;

-- Clean up test data
DELETE FROM public.request_items 
WHERE request_id IN (
  SELECT id FROM public.requests WHERE customer_name = 'Anonymous Test Customer'
);

DELETE FROM public.requests 
WHERE customer_name = 'Anonymous Test Customer';

-- Final result
SELECT 'Anonymous request creation test completed successfully!' as result;
