export interface Admin {
  id: string
  user_id: string
  role: 'admin' | 'super_admin'
  permissions: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  user_id: string
  email?: string
  store_name: string
  store_slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  logo?: { url: string; public_id: string } | null
  banner?: { url: string; public_id: string } | null
  theme_color: "blue" | "green" | "purple"
  whatsapp_number?: string
  // Social links
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  whatsapp?: string
  is_active: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  approved_by?: string
  approved_at?: string
  // Location (GeoJSON [lng, lat])
  location?: { type: 'Point'; coordinates: [number, number] }
  address?: string
  placeId?: string
  components?: Record<string, any>
  business_type?: 'products' | 'services'
  business_categories?: string[]
  business_subcategories?: string[]
  // Social Media Links
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  whatsapp?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  vendor_id: string
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface Product {
  id: string
  vendor_id: string
  category_id?: string
  title: string
  description?: string
  price: number
  stock: number
  unit?: string
  images: (string | { url: string; public_id: string })[]
  colors?: string[]
  sizes?: string[]
  weight?: string
  attributes: Record<string, any>
  status: "active" | "inactive" | "draft"
  created_at: string
  updated_at: string
  category?: Category
}

export interface Request {
  id: string
  vendor_id: string
  customer_name: string
  customer_phone: string
  customer_note?: string
  status: "pending" | "completed" | "cancelled"
  total_amount: number
  created_at: string
  updated_at: string
  request_items?: RequestItem[]
}

export interface RequestItem {
  id: string
  request_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
  product?: Product
}

export interface ThemeColors {
  blue: {
    primary: string
    secondary: string
    accent: string
  }
  green: {
    primary: string
    secondary: string
    accent: string
  }
  purple: {
    primary: string
    secondary: string
    accent: string
  }
}
