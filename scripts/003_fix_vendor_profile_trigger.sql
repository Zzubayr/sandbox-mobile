-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_vendor();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_name_value TEXT;
  store_slug_value TEXT;
  counter INTEGER := 0;
BEGIN
  -- Get store name from metadata or use default
  store_name_value := COALESCE(NEW.raw_user_meta_data ->> 'store_name', 'My Store');
  
  -- Generate initial store slug
  store_slug_value := LOWER(REPLACE(store_name_value, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  
  -- Handle potential slug conflicts by adding counter
  WHILE EXISTS (SELECT 1 FROM public.vendors WHERE store_slug = store_slug_value) LOOP
    counter := counter + 1;
    store_slug_value := LOWER(REPLACE(store_name_value, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8) || '-' || counter;
  END LOOP;
  
  -- Insert vendor profile with conflict handling
  INSERT INTO public.vendors (user_id, store_name, store_slug, theme_color)
  VALUES (
    NEW.id,
    store_name_value,
    store_slug_value,
    'blue'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create vendor profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_vendor();
