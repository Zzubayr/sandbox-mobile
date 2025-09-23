"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Heart, ShoppingCart, Package, Trash2, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useWishlist } from "@/lib/wishlist-context"
import { useCart } from "@/lib/cart-context"
import type { Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface WishlistDrawerProps {
  vendor: Vendor
}

export function WishlistDrawer({ vendor }: WishlistDrawerProps) {
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist()
  const { dispatch: cartDispatch } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({
    open: false,
    productId: null,
    productTitle: ""
  })
  const colors = getThemeColors(vendor.theme_color)

  const removeItem = (productId: string) => {
    wishlistDispatch.removeItem(productId)
    setRemoveDialog({ open: false, productId: null, productTitle: "" })
  }

  const handleRemoveClick = (productId: string, productTitle: string) => {
    setRemoveDialog({ open: true, productId, productTitle })
  }

  const addToCart = (product: any) => {
    cartDispatch.addItem(product, 1)
    // Remove from wishlist when added to cart
    wishlistDispatch.removeItem(product.id)
  }

  const addAllToCart = () => {
    wishlistState.items.forEach(product => {
      cartDispatch.addItem(product, 1)
    })
    // Clear wishlist when all items are added to cart
    wishlistDispatch.clearWishlist()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Heart className="h-5 w-5" />
          {wishlistState.items.length > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              style={{ backgroundColor: colors.primary }}
            >
              {wishlistState.items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 h-full">
        <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Wishlist
            {wishlistState.items.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {wishlistState.items.length}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {wishlistState.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Your wishlist is empty</h3>
                <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">Add some products to your wishlist</p>
                <Button 
                  onClick={() => setIsOpen(false)} 
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base px-4 sm:px-6"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <div className="space-y-3">
                  {wishlistState.items.map((product) => (
                    <div key={product.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 relative bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/store/${vendor.store_slug}/product/${product.id}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <h4 className="font-bold text-slate-900 line-clamp-2 mb-1 hover:text-slate-600 transition-colors text-sm sm:text-base">
                            {product.title}
                          </h4>
                        </Link>
                        <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3">
                          ₦{product.price.toLocaleString()}
                          {product.unit && <span className="text-slate-500">/{product.unit}</span>}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-2 sm:px-3 py-1 flex-1 sm:flex-none"
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Add to Cart</span>
                            <span className="sm:hidden">Add</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                            onClick={() => handleRemoveClick(product.id, product.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove from wishlist</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t bg-slate-50/50 px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-600">
                    {wishlistState.items.length} item{wishlistState.items.length !== 1 ? 's' : ''} in wishlist
                  </span>
                </div>

                <Button
                  className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={addAllToCart}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add All to Cart
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
        title="Remove from Wishlist"
        description={`Are you sure you want to remove "${removeDialog.productTitle}" from your wishlist?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => removeDialog.productId && removeItem(removeDialog.productId)}
      />
    </Sheet>
  )
}
