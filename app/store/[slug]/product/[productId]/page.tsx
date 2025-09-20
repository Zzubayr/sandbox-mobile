"use client"

import { useState, useEffect } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StorefrontHeader } from "@/components/storefront/header"
import { MobileActions } from "@/components/storefront/mobile-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Product, Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { useCart } from "@/lib/cart-context"
import { ProductPageSkeleton } from "@/components/ui/loading-skeleton"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const productId = params.productId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const { dispatch } = useCart()

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Get vendor by slug
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("store_slug", slug)
        .eq("is_active", true)
        .single()

      if (vendorError || !vendorData) {
        notFound()
        return
      }

      // Get product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          category:categories (name)
        `)
        .eq("id", productId)
        .eq("vendor_id", vendorData.id)
        .eq("status", "active")
        .single()

      if (productError || !productData) {
        notFound()
        return
      }

      setVendor(vendorData)
      setProduct(productData)
      setLoading(false)
    }

    fetchData()
  }, [slug, productId])

  const handleAddToCart = () => {
    if (!product) return
    dispatch({ type: "ADD_ITEM", product, quantity })
  }

  const handleCheckout = () => {
    if (!vendor) return
    router.push(`/store/${vendor.store_slug}/checkout`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ProductPageSkeleton />
        </div>
      </div>
    )
  }

  if (!vendor || !product) {
    notFound()
  }

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <StorefrontHeader vendor={vendor} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link href={`/store/${vendor.store_slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="h-16 md:h-24 w-16 md:w-24" />
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? "border-blue-500" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-balance">{product.title}</h1>
              {product.category && (
                <Badge variant="outline" className="mb-4">
                  {product.category.name}
                </Badge>
              )}
              <p className="text-2xl md:text-3xl font-bold mb-4" style={{ color: colors.primary }}>
                ${product.price}
              </p>
              {product.description && (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
                  {product.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Stock Status */}
            <div>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    In Stock
                  </Badge>
                  <span className="text-sm text-muted-foreground">{product.stock} available</span>
                </div>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Desktop Quantity Selector and Actions */}
            {product.stock > 0 && (
              <div className="space-y-4 hidden md:block">
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    size="lg"
                    style={{ backgroundColor: colors.primary }}
                    disabled={product.stock === 0}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Product Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 text-sm md:text-base">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Store Info */}
        <Card className="mt-8 md:mt-12">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              {vendor.logo_url ? (
                <img
                  src={vendor.logo_url || "/placeholder.svg"}
                  alt={vendor.store_name}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  {vendor.store_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm md:text-base" style={{ color: colors.primary }}>
                  {vendor.store_name}
                </h3>
                {vendor.description && (
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{vendor.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Actions */}
      {product.stock > 0 && (
        <MobileActions
          vendor={vendor}
          onAddToCart={handleAddToCart}
          showAddToCart
          productTitle={product.title}
          productPrice={product.price}
        />
      )}
    </div>
  )
}
