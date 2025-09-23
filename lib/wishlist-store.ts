import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/types'

interface WishlistState {
  items: Product[]
  isLoaded: boolean
}

interface WishlistActions {
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  setLoaded: () => void
}

type WishlistStore = WishlistState & WishlistActions

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoaded: false,

      // Actions
      addItem: (product: Product) => {
        const state = get()
        const existingItem = state.items.find(item => item.id === product.id)
        
        if (!existingItem) {
          set({ items: [...state.items, product] })
        }
      },

      removeItem: (productId: string) => {
        const state = get()
        const newItems = state.items.filter(item => item.id !== productId)
        set({ items: newItems })
      },

      isInWishlist: (productId: string) => {
        const state = get()
        return state.items.some(item => item.id === productId)
      },

      clearWishlist: () => {
        set({ items: [] })
      },

      setLoaded: () => {
        set({ isLoaded: true })
      },
    }),
    {
      name: 'soundcrate-wishlist', // unique name for localStorage key
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoaded()
        }
      },
    }
  )
)
