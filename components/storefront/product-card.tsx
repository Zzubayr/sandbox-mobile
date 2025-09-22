"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart } from "lucide-react"
import { CloudinaryImage } from "@/components/ui/cloudinary-image"
import Link from "next/link"
import type { Product, Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { useCart } from "@/lib/cart-context"

interface ProductCardProps {
  product: Product
  vendor: Vendor
  priority?: boolean
}

export function ProductCard({ product, vendor, priority = false }: ProductCardProps) {
  const colors = getThemeColors(vendor.theme_color)
  const { dispatch } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch.addItem(product, 1)
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/store/${vendor.store_slug}/product/${product.id}`}>
        <div className="aspect-square relative bg-gray-100 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <CloudinaryImage
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              quality="auto"
              crop="fill"
              priority={priority}
              placeholder="blur"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-8 w-8 md:h-12 md:w-12" />
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Out of Stock
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-3 md:p-4">
        <div className="space-y-2">
          <Link href={`/store/${vendor.store_slug}/product/${product.id}`}>
            <h3 className="font-semibold line-clamp-2 hover:underline text-sm md:text-base leading-tight">
              {product.title}
            </h3>
          </Link>
          {product.description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold truncate" style={{ color: colors.primary }}>
                ${product.price}
              </p>
              {product.stock > 0 && (
                <p className="text-xs text-muted-foreground hidden md:block">In Stock: {product.stock}</p>
              )}
            </div>
            <Button
              size="sm"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
              style={{ backgroundColor: colors.primary }}
              className="hover:opacity-90 text-xs md:text-sm px-3 md:px-4 min-w-[44px] min-h-[44px] flex-shrink-0"
            >
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
