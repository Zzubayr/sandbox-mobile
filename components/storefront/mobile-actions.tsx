"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import type { Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button"

interface MobileActionsProps {
  vendor: Vendor
  onAddToCart?: () => void
  onCheckout?: () => void
  showAddToCart?: boolean
  showCheckout?: boolean
  productTitle?: string
  productPrice?: number
}

export function MobileActions({
  vendor,
  onAddToCart,
  onCheckout,
  showAddToCart = false,
  showCheckout = false,
  productTitle,
  productPrice,
}: MobileActionsProps) {
  const { state } = useCart()
  const colors = getThemeColors(vendor.theme_color)

  if (!showAddToCart && !showCheckout && state.itemCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden z-50">
      <div className="flex gap-3">
        {showAddToCart && onAddToCart && (
          <Button onClick={onAddToCart} className="flex-1 min-h-[48px]" size="lg" style={{ backgroundColor: colors.primary }}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
            {productPrice && <span className="ml-2">${productPrice}</span>}
          </Button>
        )}

        {showCheckout && onCheckout && state.itemCount > 0 && (
          <Button onClick={onCheckout} className="flex-1 min-h-[48px]" size="lg" style={{ backgroundColor: colors.primary }}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Checkout ({state.itemCount})
          </Button>
        )}

        {vendor.whatsapp_number && !showAddToCart && !showCheckout && (
          <WhatsAppButton
            options={{
              vendorNumber: vendor.whatsapp_number,
              message: `Hi ${vendor.store_name}! I'm interested in your products. Can you help me?`,
            }}
            className="flex-1 min-h-[48px]"
            size="lg"
          >
            Contact Store
          </WhatsAppButton>
        )}
      </div>
    </div>
  )
}
