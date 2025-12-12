export const dynamic = "force-dynamic"
export const revalidate = 0

import { notFound } from "next/navigation"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"
import Product from "@/lib/db/models/product"
import Category from "@/lib/db/models/category"
import { StorefrontHeader } from "@/components/storefront/header"
import { ProductCard } from "@/components/storefront/product-card"
import ServiceStorefront from "@/components/storefront/service-storefront"
import { MobileActions } from "@/components/storefront/mobile-actions"
import { PendingApprovalPage } from "@/components/storefront/pending-approval-page"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getThemeColors } from "@/lib/theme-colors"
import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram, Twitter, Linkedin, Phone } from "lucide-react"

interface StorePageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any
  const { _id, ...rest } = doc as any
  return { ...rest, id: _id?.toString?.() }
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params
  const sp = (await searchParams) || {}
  const selectedCategoryParam = Array.isArray(sp.category) ? sp.category[0] : sp.category

  await connectToDatabase()
  // Get vendor by slug
  const vendorDoc = await Vendor.findOne({ store_slug: slug, is_active: true }).lean()
  if (!vendorDoc) {
    notFound()
  }
  const vendor = shapeId(vendorDoc)

  // Check if store is approved - if not, show pending approval page
  if (vendor.approval_status !== 'approved') {
    return <PendingApprovalPage vendor={vendor} />
  }

  // If this is a services business, show the dedicated services storefront
  if (vendor.business_type === "services") {
    return <ServiceStorefront vendor={vendor} />
  }

  const categoryIdFilter = selectedCategoryParam ? String(selectedCategoryParam) : undefined

  // Get products and categories
  const [productDocs, categoryDocs] = await Promise.all([
    Product.find({
      vendor_id: vendorDoc._id,
      status: "active",
      ...(categoryIdFilter ? { category_id: categoryIdFilter } : {}),
    })
      .sort({ created_at: -1 })
      .lean(),
    Category.find({ vendor_id: vendorDoc._id }).sort({ name: 1 }).lean(),
  ])

  const products = productDocs.map(shapeId)
  const categories = categoryDocs.map(shapeId)

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
        <StorefrontHeader vendor={vendor} />

      {/* Hero Banner */}
      {vendor.banner_url && (
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
          <Image 
            src={vendor.banner_url || "/placeholder.svg"} 
            alt={vendor.store_name} 
            fill 
            className="object-cover" 
            priority={true}
          />
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary}E6 0%, ${colors.dark}E6 100%)` }}
          >
            <div className="absolute inset-0 bg-black/35 md:bg-black/30 lg:bg-black/25" />
            <div className="text-center text-white px-4">
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-2 text-balance">{vendor.store_name}</h1>
              {vendor.description && (
                <p className="text-sm md:text-lg lg:text-xl opacity-90 text-pretty">{vendor.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              <Link href={`/store/${slug}`}>
                <Badge
                  variant="outline"
                  className={`cursor-pointer text-xs md:text-sm hover:opacity-90`}
                  style={!categoryIdFilter 
                    ? ({ background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`, color: '#fff', borderColor: 'transparent' } as any)
                    : ({ borderColor: colors.primary } as any)
                  }
                >
                  All Products
                </Badge>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/store/${slug}?category=${category.id}`}
                  scroll={false}
                >
                  <Badge
                    variant="outline"
                    className={`cursor-pointer text-xs md:text-sm hover:opacity-90`}
                    style={categoryIdFilter === String(category.id)
                      ? ({ background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`, color: '#fff', borderColor: 'transparent' } as any)
                      : ({ borderColor: colors.primary } as any)
                    }
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Products</h2>
            <p className="text-sm md:text-base text-muted-foreground">{products?.length || 0} products</p>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {products.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  vendor={vendor} 
                  priority={index < 4} // Priority load first 4 products
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No products available</h3>
                  <p className="text-muted-foreground">
                    {categoryIdFilter ? 'No products found in this category.' : 'This store is currently setting up their catalog.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Store Info */}
        <Card className="mt-8 md:mt-12">
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: colors.primary }}>
                About {vendor.store_name}
              </h3>
              {vendor.description && (
                <p className="text-sm md:text-base text-muted-foreground mb-4 text-pretty">{vendor.description}</p>
              )}
              
              {/* Social Media Links */}
              {(vendor.facebook || vendor.instagram || vendor.twitter || vendor.linkedin || vendor.whatsapp) && (
                <div className="flex items-center justify-center gap-3 mb-4">
                  {vendor.facebook && (
                    <a
                      href={vendor.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </a>
                  )}
                  {vendor.instagram && (
                    <a
                      href={vendor.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5 text-pink-600" />
                    </a>
                  )}
                  {vendor.twitter && (
                    <a
                      href={vendor.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5 text-sky-500" />
                    </a>
                  )}
                  {vendor.linkedin && (
                    <a
                      href={vendor.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700" />
                    </a>
                  )}
                  {vendor.whatsapp && (
                    <a
                      href={vendor.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="WhatsApp"
                    >
                      <Phone className="w-5 h-5 text-green-600" />
                    </a>
                  )}
                </div>
              )}

              <p className="text-xs md:text-sm text-muted-foreground">
                Powered by <span className="font-semibold bg-gradient-to-r from-[#2B6DA9] to-[#20527F] bg-clip-text text-transparent">Ummah Square</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Actions */}
      <MobileActions vendor={vendor} showCheckout />
    </div>
  )
}
