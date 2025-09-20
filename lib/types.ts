export interface Vendor {
  id: string
  user_id: string
  store_name: string
  store_slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  theme_color: "blue" | "green" | "purple"
  whatsapp_number?: string
  is_active: boolean
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
  images: string[]
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
