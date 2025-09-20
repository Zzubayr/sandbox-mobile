-- Create vendors table for multi-vendor support
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT 'blue',
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, slug)
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  attributes JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table (equivalent to orders/carts)
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create request_items table
CREATE TABLE IF NOT EXISTS public.request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- Vendors policies
CREATE POLICY "Vendors can view their own data" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert their own data" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own data" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active vendors" ON public.vendors
  FOR SELECT USING (is_active = true);

-- Categories policies
CREATE POLICY "Vendors can manage their categories" ON public.categories
  FOR ALL USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- Products policies
CREATE POLICY "Vendors can manage their products" ON public.products
  FOR ALL USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (status = 'active');

-- Requests policies
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

CREATE POLICY "Anyone can create requests" ON public.requests
  FOR INSERT WITH CHECK (true);

-- Request items policies
CREATE POLICY "Vendors can view their request items" ON public.request_items
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM public.requests WHERE vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can create request items" ON public.request_items
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(store_slug);
CREATE INDEX IF NOT EXISTS idx_categories_vendor_id ON public.categories(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_requests_vendor_id ON public.requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON public.request_items(request_id);
