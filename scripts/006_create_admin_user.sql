-- Create Admin User Setup Script
-- This script helps you create the first admin user

-- Step 1: First, you need to create a user account through the signup process
-- Go to /auth/signup and create an account with the email you want to use as admin

-- Step 2: After creating the user account, run this script to make them an admin
-- Replace 'your-admin-email@example.com' with the actual email you used

-- Find the user ID by email
-- SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Insert admin record (replace the user_id with the actual user ID from above)
-- INSERT INTO public.admins (user_id, role, permissions)
-- VALUES (
--   'USER_ID_FROM_ABOVE', -- Replace with actual user ID
--   'super_admin',
--   '{"can_manage_vendors": true, "can_manage_admins": true, "can_view_analytics": true}'
-- );

-- Example with a specific email (uncomment and modify as needed):
-- DO $$
-- DECLARE
--   admin_user_id UUID;
-- BEGIN
--   -- Get user ID by email
--   SELECT id INTO admin_user_id 
--   FROM auth.users 
--   WHERE email = 'admin@example.com';
--   
--   -- Check if user exists
--   IF admin_user_id IS NOT NULL THEN
--     -- Insert admin record
--     INSERT INTO public.admins (user_id, role, permissions)
--     VALUES (
--       admin_user_id,
--       'super_admin',
--       '{"can_manage_vendors": true, "can_manage_admins": true, "can_view_analytics": true}'
--     );
--     
--     RAISE NOTICE 'Admin user created successfully for email: admin@example.com';
--   ELSE
--     RAISE NOTICE 'User with email admin@example.com not found. Please create the user account first.';
--   END IF;
-- END $$;

-- Alternative: Create admin for any existing user (replace with actual user ID)
-- INSERT INTO public.admins (user_id, role, permissions)
-- VALUES (
--   'REPLACE_WITH_ACTUAL_USER_ID',
--   'super_admin',
--   '{"can_manage_vendors": true, "can_manage_admins": true, "can_view_analytics": true}'
-- );

-- Verify admin was created
-- SELECT 
--   a.id,
--   a.role,
--   a.permissions,
--   u.email,
--   a.created_at
-- FROM public.admins a
-- JOIN auth.users u ON a.user_id = u.id;

-- Instructions for creating your first admin:
-- 1. Go to your app and sign up with the email you want to use as admin
-- 2. Note down the user ID from the auth.users table
-- 3. Run the INSERT statement above with the actual user ID
-- 4. Test by logging in - you should be redirected to /admin

-- To create additional admins:
-- 1. Have them sign up normally
-- 2. Run the INSERT statement with their user ID
-- 3. They will automatically get admin access on next login
