"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Package, Share2, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { toImageUrl } from "@/lib/image-utils"
import Link from "next/link"
import type { Product, Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { cn } from "@/lib/utils"
import { useProductShare } from "@/hooks/use-product-share"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ProductCardProps {
  product: Product
  vendor: Vendor
  priority?: boolean
}

export function ProductCard({ product, vendor, priority = false }: ProductCardProps) {
  const colors = getThemeColors(vendor.theme_color)
  const { dispatch } = useCart()
  const { dispatch: wishlistDispatch, state: wishlistState } = useWishlist()
  const shareProps = useProductShare({ product, vendor })
  
  const rawUnit = (product as any)?.attributes?.price_unit || product.unit
  const unitLabel = (() => {
    switch (rawUnit) {
      case 'yard': return 'yards'
      case 'meter': return 'meters'
      case 'lb': return 'lbs'
      case 'piece': return 'pieces'
      case 'set': return 'sets'
      case 'box': return 'boxes'
      case 'pack': return 'packs'
      case 'dozen': return 'dozen'
      case 'kg': 
      case 'unit':
      default: return rawUnit || undefined
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
  const isOutOfStock = product.stock === 0

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-slate-200 hover:ring-slate-300 flex flex-col h-full">
      <Link href={`/store/${vendor.store_slug}/product/${product.id}`} className="block relative flex-1">
        {/* Image Container - Full Bleed */}
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
          {product.images && product.images.length > 0 ? (
            <Image
              src={toImageUrl(product.images[0] as any) || "/placeholder.svg"}
              alt={product.title}
              fill
              className={cn(
                "object-cover transition-transform duration-700 ease-out md:group-hover:scale-110",
                isOutOfStock ? "opacity-60 grayscale" : ""
              )}
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300">
              <Package className="h-16 w-16" />
            </div>
          )}

  
        {/* Overlays */}
          {isOutOfStock && (
             <div className="absolute inset-x-0 bottom-4 text-center z-10">
               <span className="inline-block px-3 py-1 bg-slate-900/90 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md backdrop-blur-md">
                 Sold Out
               </span>
             </div>
          )}

          {/* Share / Wishlist */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-300 group/heart"
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-colors", 
                  isInWishlist ? "text-red-500 fill-red-500" : "text-slate-600 group-hover/heart:text-red-500"
                )} 
              />
            </button>

            {/* Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-300 group/share disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {shareProps.isGenerating ? (
                    <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 text-slate-600 group-hover/share:text-slate-900" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Share</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    shareProps.shareLink()
                  }}
                  className="gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Share link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    shareProps.shareImage()
                  }}
                  className="gap-2"
                  disabled={shareProps.isSharing || shareProps.isGenerating}
                >
                  {shareProps.isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {shareProps.isSharing ? "Sharing..." : shareProps.isGenerating ? "Preparing..." : "Share image"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* DESKTOP ONLY: Quick Actions (Slide up on hover) */}
           {!isOutOfStock && (
             <div className="hidden md:block absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                 <Button 
                   onClick={handleAddToCart}
                   className="w-full bg-white text-slate-900 hover:bg-slate-100 shadow-lg border-none h-11 font-medium rounded-xl"
                 >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                 </Button>
             </div>
           )}

        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
           <div>
              <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors" style={{ '--primary': colors.primary } as any}>
                {product.title}
              </h3>
              {product.description && (
                <p className="text-xs text-slate-500 line-clamp-1 mt-1 opacity-80">
                  {product.description}
                </p>
              )}
           </div>

           <div className="flex items-center justify-between">
              <div>
                 <div className="font-bold text-lg text-slate-900 flex items-baseline gap-1">
                    ₦{product.price.toLocaleString()}
                    {unitLabel && (
                       <span className="text-xs text-slate-400 font-normal">/{unitLabel}</span>
                    )}
                 </div>
                 {product.stock > 0 && product.stock < 10 && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">
                       Low Stock
                    </span>
                 )}
              </div>
           </div>
        </div>
      </Link>

      {/* MOBILE ONLY: Footer with Add to Cart - Always Visible */}
      {!isOutOfStock && (
        <div className="px-4 pb-4 pt-0 mt-auto md:hidden">
          <Button 
            onClick={handleAddToCart}
            className="w-full shadow-sm active:scale-95 transition-all duration-200 font-medium rounded-xl text-white border-0 h-10"
            style={{ 
              backgroundColor: colors.primary,
            } as any}
          >
             <ShoppingCart className="w-4 h-4 mr-2" />
             Add
          </Button>
        </div>
      )}
    </div>
  )
}
