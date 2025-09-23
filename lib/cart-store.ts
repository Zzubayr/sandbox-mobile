import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/types'
import { toastHelpers } from '@/lib/toast-helpers'

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isLoaded: boolean
}

interface CartActions {
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setLoaded: () => void
}

type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      total: 0,
      itemCount: 0,
      isLoaded: false,

      // Actions
      addItem: (product: Product, quantity = 1) => {
        const state = get()
        const existingItemIndex = state.items.findIndex(
          (item) => item.product.id === product.id
        )

        let newItems: CartItem[]
        if (existingItemIndex >= 0) {
          newItems = state.items.map((item, index) =>
            index === existingItemIndex
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + quantity,
                    product.stock
                  ),
                }
              : item
          )
        } else {
          newItems = [
            ...state.items,
            {
              product,
              quantity: Math.min(quantity, product.stock),
            },
          ]
        }

        const total = newItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
        const itemCount = newItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )

        set({ items: newItems, total, itemCount })
        toastHelpers.addedToCart(product.title)
      },

      removeItem: (productId: string) => {
        const state = get()
        const removedItem = state.items.find(
          (item) => item.product.id === productId
        )
        
        const newItems = state.items.filter(
          (item) => item.product.id !== productId
        )
        const total = newItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
        const itemCount = newItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )

        set({ items: newItems, total, itemCount })
        
        if (removedItem) {
          toastHelpers.removedFromCart(removedItem.product.title)
        }
      },

      updateQuantity: (productId: string, quantity: number) => {
        const state = get()
        const newItems = state.items
          .map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: Math.max(0, Math.min(quantity, item.product.stock)),
                }
              : item
          )
          .filter((item) => item.quantity > 0)

        const total = newItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
        const itemCount = newItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )

        set({ items: newItems, total, itemCount })
      },

      clearCart: () => {
        const state = get()
        if (state.items.length > 0) {
          toastHelpers.cartCleared()
        }
        set({ items: [], total: 0, itemCount: 0 })
      },

      setLoaded: () => {
        set({ isLoaded: true })
      },
    }),
    {
      name: 'soundcrate-cart', // unique name for localStorage key
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoaded()
        }
      },
    }
  )
)

