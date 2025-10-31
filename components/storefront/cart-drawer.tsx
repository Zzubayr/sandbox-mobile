"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"
import { toImageUrl } from "@/lib/image-utils"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import type { Vendor } from "@/lib/types"
import { useCartDrawerStore } from "@/lib/cart-drawer-store"
import { getThemeColors } from "@/lib/theme-colors"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface CartDrawerProps {
  vendor: Vendor
}

export function CartDrawer({ vendor }: CartDrawerProps) {
  const { state, dispatch } = useCart()
  const { isOpen, open, close } = useCartDrawerStore()
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({
    open: false,
    productId: null,
    productTitle: ""
  })
  const colors = getThemeColors(vendor.theme_color)

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch.updateQuantity(productId, quantity)
  }

  const removeItem = (productId: string) => {
    dispatch.removeItem(productId)
    setRemoveDialog({ open: false, productId: null, productTitle: "" })
  }

  const handleRemoveClick = (productId: string, productTitle: string) => {
    setRemoveDialog({ open: true, productId, productTitle })
  }

  // Scope cart contents to this vendor only
  const vendorItems = state.items.filter((it) => (it.product as any).vendor_id === vendor.id)
  const vendorItemCount = vendorItems.reduce((sum, it) => sum + it.quantity, 0)
  const vendorTotal = vendorItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? open() : close())}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {vendorItemCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              style={{ backgroundColor: colors.primary }}
            >
              {vendorItemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {vendorItemCount > 0 && (
              <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded-full">
                {vendorItemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {vendorItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Your cart is empty</h3>
                <p className="text-slate-500 mb-6">Add some products to get started</p>
                <Button 
                  onClick={() => close()} 
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-3">
                  {vendorItems.map((item) => (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 relative bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={toImageUrl(item.product.images[0] as any) || "/placeholder.svg"}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <ShoppingCart className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 line-clamp-2 mb-1">{item.product.title}</h4>
                        <p className="text-sm text-slate-600 mb-3">₦{item.product.price.toLocaleString()}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-50"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center text-slate-900">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-white border-slate-300 hover:bg-slate-50"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveClick(item.product.id, item.product.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t bg-slate-50/50 px-6 py-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">Total:</span>
                  <span className="text-2xl font-bold text-slate-900">
                    ₦{vendorTotal.toLocaleString()}
                  </span>
                </div>

                <Button
                  className="w-full h-12 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white"
                  asChild
                  onClick={() => close()}
                >
                  <Link href={`/store/${vendor.store_slug}/checkout`}>
                    Proceed to Checkout
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={removeDialog.open}
        onOpenChange={(open) => setRemoveDialog({ ...removeDialog, open })}
        title="Remove Item"
        description={`Are you sure you want to remove "${removeDialog.productTitle}" from your cart?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => removeDialog.productId && removeItem(removeDialog.productId)}
      />
    </Sheet>
  )
}
