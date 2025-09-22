"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Heart, Store, Sparkles } from "lucide-react"
import Link from "next/link"
import { getThemeColors } from "@/lib/theme-colors"
import { CloudinaryImage } from "@/components/ui/cloudinary-image"
import { CartDrawer } from "./cart-drawer"
import { MobileSearch } from "./mobile-search"
import type { Vendor } from "@/lib/types"

interface StorefrontHeaderProps {
  vendor: Vendor
  cartItemCount?: number
}

export function StorefrontHeader({ vendor, cartItemCount = 0 }: StorefrontHeaderProps) {
  const colors = getThemeColors(vendor.theme_color)

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
                <Link href={`/store/${vendor.store_slug}`} className="flex items-center gap-3 min-w-0">
                  {vendor.logo_url ? (
                    <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-200">
                      <CloudinaryImage
                        src={vendor.logo_url}
                        alt={vendor.store_name}
                        width={40}
                        height={40}
                        className="object-cover"
                        quality="auto"
                        crop="fill"
                        priority={true}
                        placeholder="blur"
                        sizes="40px"
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
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search products..." 
                className="w-[200px] pl-8 lg:w-[300px] cursor-pointer" 
                onClick={() => window.location.href = `/store/${vendor.store_slug}/search`}
                readOnly
              />
            </div>

            {/* Mobile Search */}
            <MobileSearch />

            <Button variant="ghost" size="icon" className="relative hidden sm:flex">
              <Heart className="h-5 w-5" />
            </Button>

            <CartDrawer vendor={vendor} />
          </div>
        </div>
      </div>
    </header>
  )
}
