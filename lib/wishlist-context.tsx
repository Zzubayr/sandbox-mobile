"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useWishlistStore } from "@/lib/wishlist-store"

const WishlistContext = createContext<{
  state: {
    items: ReturnType<typeof useWishlistStore>['items']
    isLoaded: ReturnType<typeof useWishlistStore>['isLoaded']
  }
  dispatch: {
    addItem: ReturnType<typeof useWishlistStore>['addItem']
    removeItem: ReturnType<typeof useWishlistStore>['removeItem']
    isInWishlist: ReturnType<typeof useWishlistStore>['isInWishlist']
    clearWishlist: ReturnType<typeof useWishlistStore>['clearWishlist']
  }
} | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const store = useWishlistStore()

  // Set loaded state on mount
  useEffect(() => {
    if (!store.isLoaded) {
      store.setLoaded()
    }
  }, [store.isLoaded, store.setLoaded])

  const contextValue = {
    state: {
      items: store.items,
      isLoaded: store.isLoaded,
    },
    dispatch: {
      addItem: store.addItem,
      removeItem: store.removeItem,
      isInWishlist: store.isInWishlist,
      clearWishlist: store.clearWishlist,
    },
  }

  return <WishlistContext.Provider value={contextValue}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
