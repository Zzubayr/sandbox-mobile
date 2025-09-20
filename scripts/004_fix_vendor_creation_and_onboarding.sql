-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_vendor();

-- Create improved function to auto-create vendor profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_name_val text;
  store_slug_val text;
  counter integer := 0;
BEGIN
  -- Get store name from metadata or use email prefix
  store_name_val := COALESCE(
    NEW.raw_user_meta_data ->> 'store_name',
    SPLIT_PART(NEW.email, '@', 1) || '''s Store'
  );
  
  -- Create base slug
  store_slug_val := LOWER(REGEXP_REPLACE(store_name_val, '[^a-zA-Z0-9]+', '-', 'g'));
  store_slug_val := TRIM(store_slug_val, '-');
  
  -- Ensure unique slug
  WHILE EXISTS (SELECT 1 FROM public.vendors WHERE store_slug = store_slug_val) LOOP
    counter := counter + 1;
    store_slug_val := LOWER(REGEXP_REPLACE(store_name_val, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
  END LOOP;
  
  -- Insert vendor profile
  INSERT INTO public.vendors (
    user_id, 
    store_name, 
    store_slug, 
    theme_color,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    store_name_val,
    store_slug_val,
    'blue',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create vendor profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_vendor();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.vendors TO authenticated;
