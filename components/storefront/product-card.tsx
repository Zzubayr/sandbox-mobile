"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Package } from "lucide-react"
import Image from "next/image"
import { toImageUrl } from "@/lib/image-utils"
import Link from "next/link"
import type { Product, Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"

interface ProductCardProps {
  product: Product
  vendor: Vendor
  priority?: boolean
}

export function ProductCard({ product, vendor, priority = false }: ProductCardProps) {
  const colors = getThemeColors(vendor.theme_color)
  const { dispatch } = useCart()
  const { dispatch: wishlistDispatch, state: wishlistState } = useWishlist()

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch.addItem(product, 1)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (wishlistState.items.some((item: Product) => item.id === product.id)) {
      wishlistDispatch.removeItem(product.id)
    } else {
      wishlistDispatch.addItem(product)
    }
  }

  const isInWishlist = wishlistState.items.some((item: Product) => item.id === product.id)

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white">
      <Link href={`/store/${vendor.store_slug}/product/${product.id}`}>
        <div className="aspect-square relative bg-slate-50 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={toImageUrl(product.images[0] as any) || "/placeholder.svg"}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <Package className="h-12 w-12" />
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
              <Badge variant="secondary" className="text-xs bg-white text-slate-900">
                Out of Stock
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm ${
              isInWishlist ? 'opacity-100' : ''
            }`}
            onClick={handleWishlistToggle}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="space-y-3">
          <Link href={`/store/${vendor.store_slug}/product/${product.id}`}>
            <h3 className="font-bold line-clamp-2 hover:text-slate-600 transition-colors text-xl leading-tight text-slate-900">
              {product.title}
            </h3>
          </Link>
          {product.description && (
            <p className="text-xs text-slate-500 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex sm:items-center sm:justify-between gap-3 flex-col sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-slate-900">
                  ₦{product.price.toLocaleString()}
                  {unitLabel && (
                    <span className="text-sm text-slate-600 font-medium">/{unitLabel}</span>
                  )}
                </p>
              </div>
              {product.stock > 0 && product.stock < 5 && (
                <p className="text-xs text-amber-700 mt-1">
                  Only {product.stock} left
                </p>
              )}
            </div>
            <Button
              size="sm"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 min-w-[80px] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
