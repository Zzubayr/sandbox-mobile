"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useCartStore } from "@/lib/cart-store"

const CartContext = createContext<{
  state: {
    items: ReturnType<typeof useCartStore>['items']
    total: ReturnType<typeof useCartStore>['total']
    itemCount: ReturnType<typeof useCartStore>['itemCount']
    isLoaded: ReturnType<typeof useCartStore>['isLoaded']
  }
  dispatch: {
    addItem: ReturnType<typeof useCartStore>['addItem']
    removeItem: ReturnType<typeof useCartStore>['removeItem']
    updateQuantity: ReturnType<typeof useCartStore>['updateQuantity']
    clearCart: ReturnType<typeof useCartStore>['clearCart']
  }
} | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const store = useCartStore()

  // Set loaded state on mount
  useEffect(() => {
    if (!store.isLoaded) {
      store.setLoaded()
    }
  }, [store.isLoaded, store.setLoaded])

  const contextValue = {
    state: {
      items: store.items,
      total: store.total,
      itemCount: store.itemCount,
      isLoaded: store.isLoaded,
    },
    dispatch: {
      addItem: store.addItem,
      removeItem: store.removeItem,
      updateQuantity: store.updateQuantity,
      clearCart: store.clearCart,
    },
  }

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}