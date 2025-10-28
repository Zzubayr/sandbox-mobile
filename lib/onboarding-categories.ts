export type BusinessKind = 'products' | 'services'

export const PRODUCT_CATEGORIES: Record<string, string[]> = {
  'Fashion & Apparel': [
    'Men’s Clothing',
    'Women’s Clothing',
    'Children’s Clothing',
    'Abayas & Hijabs',
    'Traditional Wear',
    'Footwear',
    'Bags & Accessories',
    'Jewelry & Watches',
  ],
  'Food & Beverages': [
    'Restaurants / Cafés',
    'Bakeries, Pastries & Desserts',
    'Halal Meat & Poultry',
    'Snacks & Beverages',
    'Packaged Foods',
    'Fresh Produce',
  ],
  'Beauty & Personal Care': [
    'Skincare',
    'Haircare',
    'Fragrances (Perfumes, Attars, Bakhoor)',
    'Makeup (Halal-certified)',
    "Personal Hygiene"
  ],
  'Homewares & Furniture': [
    'Furniture',
    'Home Decor',
    "Lighting",
    'Kitchenware',
    'Bedding & Textiles',
    "Home Organization & Storage",
    "Cleaning Supplies & Laundry Essentials",
    "Garden & Outdoor Living"
  ],
  'Groceries & Everyday Essentials': [
    'Household Supplies',
    'Cleaning Products',
    'Baby Products & Diapers',
    "Pet Supplies",
  ],
  'Electronics & Gadgets': [
    'Mobile Devices & Accessories',
    'Computers & Hardware',
    'Audio & Visual Equipment',
    'Home Appliances',
    "Smart Home Devices"
  ],
  'Books, Islamic Items & Stationeries': [
    'Islamic Literature (Qurans, Books)',
    'Prayer Mats, Tasbih, etc.',
    'Stationery & Office Supplies',
    'Children’s Educational Products',
  ],
  'Arts, Crafts & Gifts': [
    'Handmade Products',
    'Calligraphy',
    'Prints & Decorations',
    "DIY Supplies & Craft Materials"
  ],
  'Health & Fitness': [
    'Supplements (Halal-certified only)',
    'Sports Equipment',
    "Fitness Apparel & Footwear"
  ],
}

export const SERVICE_CATEGORIES: Record<string, string[]> = {
  'Professional Services': [
    'Legal',
    'Consulting',
    'Accounting & Tax',
    'Architecture & Engineering',
    'IT Services (Websites, Software)',
  ],
  'Health & Wellness': [
    'Clinics / Physicians',
    'Mental Health Services',
    "Physical Therapy & Rehabilitation",
    'Fitness Coaches & Personal Training',
    'Spa / Massage (Sharia-compliant)',
  ],
  'Beauty & Grooming Services': [
    'Barbers & Hair Stylists',
    'Makeup Artists',
    'Skincare Specialists',
  ],
  'Education & Training': [
    'Private Tutors',
    'Language Classes',
    'Skills Training',
    'Islamic Education',
  ],
  'Event Services': [
    'Event Planning & Coordination',
    'Catering Services',
    'Photographers & Videographers',
    'Decoration Services',
    'DJ/Entertainment',
  ],
  'Home Services': [
    'Cleaning & Housekeeping',
    'Repairs / Handyman',
    'Plumbing',
    'Electrical',
    "Painting & Renovation",
    'Gardening & Landscaping',
    'Pest Control'
  ],
  'Delivery & Logistics': [
    'Courier Services',
    'Moving & Transportation',
    "Freight & Cargo"
  ],
  'Creative & Media Services': [
    'Graphic Design',
    'Printing & Branding',
    'Social Media Management',
    'Marketing / Advertising',
    "Content Creation & Video Production"
  ],
}

export function getCategoryMap(kind: BusinessKind) {
  return kind === 'products' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES
}

