"use client"

import { Button } from "@/components/ui/button"
import { Search, Heart, Store, Sparkles } from "lucide-react"
import Link from "next/link"
import { getThemeColors } from "@/lib/theme-colors"
import Image from "next/image"
import { CartDrawer } from "./cart-drawer"
import { WishlistDrawer } from "./wishlist-drawer"
import { MobileSearch } from "./mobile-search"
import { useSpotlightSearch } from "@/hooks/use-spotlight-search"
import type { Vendor } from "@/lib/types"

interface StorefrontHeaderProps {
  vendor: Vendor
  cartItemCount?: number
}

export function StorefrontHeader({ vendor, cartItemCount = 0 }: StorefrontHeaderProps) {
  const colors = getThemeColors(vendor.theme_color)
  const { openSearch } = useSpotlightSearch()

  const handleSearchClick = () => {
    openSearch('storefront', vendor.store_slug)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
                <Link href={`/store/${vendor.store_slug}`} className="flex items-center gap-3 min-w-0">
                  {vendor.logo_url ? (
                    <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-200 relative">
                      <Image
                        src={vendor.logo_url}
                        alt={vendor.store_name}
                        fill
                        className="object-cover"
                        priority={true}
                      />
                    </div>
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                      }}
                    >
                      {vendor.store_name.charAt(0).toUpperCase()}
                    </div>
                  )}
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {vendor.store_name}
                </h1>
                {vendor.description && (
                  <p className="text-xs md:text-sm text-slate-500 truncate hidden sm:block">
                    {vendor.description}
                  </p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Search */}
            <div 
              className="relative hidden md:block cursor-pointer"
              onClick={handleSearchClick}
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search products... (⌘K)" 
                className="w-[200px] pl-8 lg:w-[300px] h-9 px-3 py-1 text-sm border border-input bg-background rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" 
                onClick={handleSearchClick}
                onFocus={handleSearchClick}
                readOnly
              />
            </div>

            {/* Mobile Search */}
            <MobileSearch vendor={vendor} />

            <WishlistDrawer vendor={vendor} />

            <CartDrawer vendor={vendor} />
          </div>
        </div>
      </div>
    </header>
  )
}
