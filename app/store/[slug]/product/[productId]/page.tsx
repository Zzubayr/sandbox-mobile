"use client"

import { useState, useEffect } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StorefrontHeader } from "@/components/storefront/header"
import { MobileActions } from "@/components/storefront/mobile-actions"
import { PendingApprovalPage } from "@/components/storefront/pending-approval-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Product, Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
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
  const { dispatch: wishlistDispatch, state: wishlistState } = useWishlist()

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

      // Check if store is approved
      if (vendorData.approval_status !== 'approved') {
        setVendor(vendorData)
        setProduct(null) // Don't set product for unapproved stores
        setLoading(false)
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
    dispatch.addItem(product, quantity)
  }

  const handleWishlistToggle = () => {
    if (!product) return
    
    if (wishlistState.items.some((item: Product) => item.id === product.id)) {
      wishlistDispatch.removeItem(product.id)
    } else {
      wishlistDispatch.addItem(product)
    }
  }

  const handleCheckout = () => {
    if (!vendor) return
    router.push(`/store/${vendor.store_slug}/checkout`)
  }

  const isInWishlist = product ? wishlistState.items.some((item: Product) => item.id === product.id) : false

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ProductPageSkeleton />
        </div>
      </div>
    )
  }

  if (!vendor) {
    notFound()
  }

  // Show pending approval page if store is not approved
  if (vendor.approval_status !== 'approved') {
    return <PendingApprovalPage vendor={vendor} />
  }

  if (!product) {
    notFound()
  }

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <StorefrontHeader vendor={vendor} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 -ml-4 text-slate-600 hover:text-slate-900">
            <Link href={`/store/${vendor.store_slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative bg-white rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index 
                        ? "border-slate-900 shadow-md" 
                        : "border-slate-200 hover:border-slate-300"
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 leading-tight">{product.title}</h1>
                  {product.category && (
                    <Badge variant="outline" className="mb-4 text-xs border-slate-300 text-slate-600">
                      {product.category.name}
                    </Badge>
                  )}
                </div>
                
                {(() => {
                  const rawUnit = (product as any)?.attributes?.price_unit || product.unit
                  const unitLabel = (() => {
                    switch (rawUnit) {
                      case 'yard':
                        return 'yards'
                      case 'meter':
                        return 'meters'
                      case 'lb':
                        return 'lbs'
                      case 'piece':
                        return 'pieces'
                      case 'set':
                        return 'sets'
                      case 'box':
                        return 'boxes'
                      case 'pack':
                        return 'packs'
                      case 'dozen':
                        return 'dozen'
                      case 'kg':
                      case 'unit':
                      default:
                        return rawUnit || undefined
                    }
                  })()
                  return (
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl md:text-4xl font-bold text-slate-900">
                        ₦{product.price.toLocaleString()}
                        {unitLabel && (
                          <span className="text-lg text-slate-500">/{unitLabel}</span>
                        )}
                      </p>
                    </div>
                  )
                })()}

                {product.description && (
                  <p className="text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              {product.stock > 0 ? (
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    In Stock
                  </Badge>
                  {(() => {
                    const stockRawUnit = (product as any)?.attributes?.stock_unit || 'units'
                    const stockUnitLabel = (() => {
                      switch (stockRawUnit) {
                        case 'yard':
                          return 'yards'
                        case 'meter':
                          return 'meters'
                        case 'lb':
                          return 'lbs'
                        case 'piece':
                          return 'pieces'
                        case 'set':
                          return 'sets'
                        case 'box':
                          return 'boxes'
                        case 'pack':
                          return 'packs'
                        case 'dozen':
                          return 'dozen'
                        case 'kg':
                        case 'units':
                        case 'unit':
                        default:
                          return stockRawUnit || 'units'
                      }
                    })()
                    return (
                      <span className="text-sm text-slate-600">{product.stock} {stockUnitLabel} available</span>
                    )
                  })()}
                </div>
              ) : (
                <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Desktop Quantity Selector and Actions */}
            {product.stock > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block text-slate-700">Quantity</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-12 text-center text-slate-900">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                    size="lg"
                    disabled={product.stock === 0}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className={`border-slate-300 hover:bg-slate-50 ${isInWishlist ? 'border-red-300 bg-red-50' : ''}`}
                    onClick={handleWishlistToggle}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist ? 'text-red-500 fill-red-500' : ''}`} />
                  </Button>
                </div>
              </div>
            )}

            {/* Product Details */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-semibold mb-4 text-slate-900">Product Details</h3>
                <div className="space-y-3">
                  {Object.entries(product.attributes)
                    .filter(([key]) => !['price_unit', 'stock_unit'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-b-0">
                        <span className="text-slate-600 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-900 font-semibold">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Store Info */}
        <div className="mt-8 md:mt-12">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {vendor.logo_url ? (
                  <Image
                    src={vendor.logo_url}
                    alt={vendor.store_name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {vendor.store_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg text-slate-900">
                    {vendor.store_name}
                  </h3>
                  {vendor.description && (
                    <p className="text-sm text-slate-600 mt-1">{vendor.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
