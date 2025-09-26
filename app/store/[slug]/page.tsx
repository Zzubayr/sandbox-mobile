import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StorefrontHeader } from "@/components/storefront/header"
import { ProductCard } from "@/components/storefront/product-card"
import { MobileActions } from "@/components/storefront/mobile-actions"
import { PendingApprovalPage } from "@/components/storefront/pending-approval-page"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getThemeColors } from "@/lib/theme-colors"
import Image from "next/image"
import Link from "next/link"

interface StorePageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params
  const sp = (await searchParams) || {}
  const selectedCategoryParam = Array.isArray(sp.category) ? sp.category[0] : sp.category

  const supabase = await createClient()

  // Get vendor by slug
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("*")
    .eq("store_slug", slug)
    .eq("is_active", true)
    .single()

  if (vendorError || !vendor) {
    notFound()
  }

  // Check if store is approved - if not, show pending approval page
  if (vendor.approval_status !== 'approved') {
    return <PendingApprovalPage vendor={vendor} />
  }

  // Get products and categories
  const productsQuery = supabase
    .from("products")
    .select(`
        *,
        category:categories (name)
      `)
    .eq("vendor_id", vendor.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  // Apply category filter if provided
  const categoryIdFilter = selectedCategoryParam ? String(selectedCategoryParam) : undefined
  const productsPromise = categoryIdFilter
    ? productsQuery.eq("category_id", categoryIdFilter)
    : productsQuery

  const [{ data: products }, { data: categories }] = await Promise.all([
    productsPromise,
    supabase.from("categories").select("*").eq("vendor_id", vendor.id).order("name"),
  ])

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
        <StorefrontHeader vendor={vendor} />

      {/* Hero Banner */}
      {vendor.banner_url && (
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">          <Image 
            src={vendor.banner_url || "/placeholder.svg"} 
            alt={vendor.store_name} 
            fill 
            className="object-cover" 
            priority={true}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
                  className={`cursor-pointer text-xs md:text-sm ${!categoryIdFilter ? 'bg-gray-900 text-white hover:bg-gray-800' : 'hover:bg-gray-100'}`}
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
                    className={`cursor-pointer text-xs md:text-sm ${categoryIdFilter === String(category.id) ? 'bg-gray-900 text-white hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    style={{ borderColor: colors.primary }}
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
              <p className="text-xs md:text-sm text-muted-foreground">
                Powered by <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Ummah Square</span>
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

