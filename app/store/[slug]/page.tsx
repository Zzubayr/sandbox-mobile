import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StorefrontHeader } from "@/components/storefront/header"
import { ProductCard } from "@/components/storefront/product-card"
import { MobileActions } from "@/components/storefront/mobile-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getThemeColors } from "@/lib/theme-colors"
import Image from "next/image"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
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

  // Get products and categories
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        category:categories (name)
      `)
      .eq("vendor_id", vendor.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").eq("vendor_id", vendor.id).order("name"),
  ])

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <StorefrontHeader vendor={vendor} />

      {/* Hero Banner */}
      {vendor.banner_url && (
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
          <Image src={vendor.banner_url || "/placeholder.svg"} alt={vendor.store_name} fill className="object-cover" />
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
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 text-xs md:text-sm">
                All Products
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 text-xs md:text-sm"
                  style={{ borderColor: colors.primary }}
                >
                  {category.name}
                </Badge>
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
              {products.map((product) => (
                <ProductCard key={product.id} product={product} vendor={vendor} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No products available</h3>
                  <p className="text-muted-foreground">This store is currently setting up their catalog.</p>
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
                Powered by <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sandbox</span>
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
