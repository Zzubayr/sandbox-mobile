-- Create function to auto-create vendor profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vendors (user_id, store_name, store_slug, theme_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'store_name', 'My Store'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'store_name', 'my-store'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8),
    'blue'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_vendor();
