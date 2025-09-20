"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { toastHelpers } from "./toast-helpers"
import type { Product } from "@/lib/types"

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product; quantity?: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; items: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex((item) => item.product.id === action.product.id)
      const quantity = action.quantity || 1

      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: Math.min(item.quantity + quantity, action.product.stock) }
            : item,
        )
      } else {
        newItems = [...state.items, { product: action.product, quantity: Math.min(quantity, action.product.stock) }]
      }

      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.product.id !== action.productId)
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: Math.min(Math.max(0, action.quantity), item.product.stock) }
          : item,
      )

      const filteredItems = newItems.filter((item) => item.quantity > 0)
      const total = filteredItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: filteredItems, total, itemCount }
    }

    case "CLEAR_CART":
      return { items: [], total: 0, itemCount: 0 }

    case "LOAD_CART": {
      const total = action.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = action.items.reduce((sum, item) => sum + item.quantity, 0)
      return { items: action.items, total, itemCount }
    }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  })

  // Enhanced dispatch with toast notifications
  const enhancedDispatch = (action: CartAction) => {
    const previousItems = state.items
    dispatch(action)
    
    // Add toast notifications based on action type
    switch (action.type) {
      case "ADD_ITEM": {
        const existingItem = previousItems.find(item => item.product.id === action.product.id)
        if (existingItem) {
          toastHelpers.addedToCart(action.product.title)
        } else {
          toastHelpers.addedToCart(action.product.title)
        }
        break
      }
      case "REMOVE_ITEM": {
        const removedItem = previousItems.find(item => item.product.id === action.productId)
        if (removedItem) {
          toastHelpers.removedFromCart(removedItem.product.title)
        }
        break
      }
      case "CLEAR_CART": {
        if (previousItems.length > 0) {
          toastHelpers.cartCleared()
        }
        break
      }
    }
  }

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("sandbox-cart")
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", items })
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sandbox-cart", JSON.stringify(state.items))
  }, [state.items])

  return <CartContext.Provider value={{ state, dispatch: enhancedDispatch }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
