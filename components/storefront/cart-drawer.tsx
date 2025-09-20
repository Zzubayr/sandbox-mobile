"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import type { Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface CartDrawerProps {
  vendor: Vendor
}

export function CartDrawer({ vendor }: CartDrawerProps) {
  const { state, dispatch } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({
    open: false,
    productId: null,
    productTitle: ""
  })
  const colors = getThemeColors(vendor.theme_color)

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity })
  }

  const removeItem = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId })
    setRemoveDialog({ open: false, productId: null, productTitle: "" })
  }

  const handleRemoveClick = (productId: string, productTitle: string) => {
    setRemoveDialog({ open: true, productId, productTitle })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {state.itemCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              style={{ backgroundColor: colors.primary }}
            >
              {state.itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({state.itemCount})</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-4">Add some products to get started</p>
                <Button onClick={() => setIsOpen(false)} style={{ backgroundColor: colors.primary }}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0] || "/placeholder.svg"}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <ShoppingCart className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-2">{item.product.title}</h4>
                        <p className="text-sm text-muted-foreground">${item.product.price}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 bg-transparent min-w-[44px] min-h-[44px]"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 bg-transparent min-w-[44px] min-h-[44px]"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px]"
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

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${state.total.toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  style={{ backgroundColor: colors.primary }}
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={`/store/${vendor.store_slug}/checkout`}>Proceed to Checkout</Link>
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
