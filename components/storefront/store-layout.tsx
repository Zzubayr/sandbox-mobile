"use client"

import type React from "react"
import { useEffect } from "react"
import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import { getThemeColors } from "@/lib/theme-colors"
import type { Vendor } from "@/lib/types"

interface StoreLayoutProps {
  children: React.ReactNode
  vendor: Vendor
}

export default function StoreLayout({ children, vendor }: StoreLayoutProps) {
  useEffect(() => {
    // Apply vendor's theme to the storefront
    const colors = getThemeColors(vendor.theme_color)
    const root = document.documentElement

    // Apply theme CSS variables
    Object.entries({
      '--theme-primary': colors.primary,
      '--theme-secondary': colors.secondary,
      '--theme-accent': colors.accent,
      '--theme-light': colors.light,
      '--theme-dark': colors.dark,
      '--theme-darker': colors.darker,
    }).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Add theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${vendor.theme_color}`)
  }, [vendor.theme_color])

  return (
    <CartProvider>
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </CartProvider>
  )
}
