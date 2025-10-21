"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Package, ShoppingCart, X, ArrowUp, ArrowDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCartDrawerStore } from "@/lib/cart-drawer-store"
import { useSpotlightSearch } from "@/hooks/use-spotlight-search"

interface SearchResult {
  id: string
  title: string
  description?: string
  url: string
  icon: React.ReactNode
  category?: string
}

interface SpotlightSearchProps {
  isOpen: boolean
  onClose: () => void
  context: "dashboard" | "storefront"
  vendorSlug?: string
}

export function SpotlightSearch({ isOpen, onClose, context, vendorSlug }: SpotlightSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { isOpen: ctxOpen } = useSpotlightSearch()

  useEffect(() => {
    const saved = localStorage.getItem("recent-searches")
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  const addRecentSearch = useCallback((newQuery: string) => {
    if (!newQuery.trim()) return
    setRecentSearches((prev) => {
      const updated = [newQuery, ...prev.filter((q) => q !== newQuery)].slice(0, 5)
      localStorage.setItem("recent-searches", JSON.stringify(updated))
      return updated
    })
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    if (searchQuery.length <= 2) {
      const tipResults: SearchResult[] = [
        {
          id: "search-tip-short",
          title: "Type at least 3 characters to search",
          description: `You've typed ${searchQuery.length} character${searchQuery.length === 1 ? '' : 's'}. Enter more to search products.`,
          url: "#",
          icon: <Search className="h-4 w-4" />,
          category: "Tip",
        },
      ]
      if (context === "dashboard") {
        tipResults.push(
          {
            id: "quick-add-product",
            title: "Add New Product",
            description: "Create a new product",
            url: "/dashboard/products/new",
            icon: <Package className="h-4 w-4" />,
            category: "Quick Access",
          },
          {
            id: "quick-view-products",
            title: "View All Products",
            description: "Manage your products",
            url: "/dashboard/products",
            icon: <Package className="h-4 w-4" />,
            category: "Quick Access",
          }
        )
      } else if (context === "storefront" && vendorSlug) {
        tipResults.push(
          {
            id: "quick-browse-all",
            title: "Browse All Products",
            description: "View all available products",
            url: `/store/${vendorSlug}`,
            icon: <Package className="h-4 w-4" />,
            category: "Quick Access",
          },
          {
            id: "quick-view-cart",
            title: "View Cart",
            description: "Check your cart items",
            url: `/store/${vendorSlug}/cart`,
            icon: <ShoppingCart className="h-4 w-4" />,
            category: "Quick Access",
          }
        )
      }
      setResults(tipResults)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setResults([])
    setSelectedIndex(0)

    try {
      let newResults: SearchResult[] = []
      if (context === "dashboard") {
        const res = await fetch(`/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' })
        if (res.ok) {
          const { products, requests } = await res.json()
          if (products?.length) {
            newResults = newResults.concat(
              products.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description || "No description",
                url: `/dashboard/products/${p.id}/edit`,
                icon: <Package className="h-4 w-4" />,
                category: "Products",
              }))
            )
          }
          if (requests?.length) {
            newResults = newResults.concat(
              requests.map((r: any) => ({
                id: r.id,
                title: r.customer_name || r.customer_phone,
                description: `${r.customer_phone || ''} • ${new Date(r.created_at).toLocaleString()}`,
                url: `/dashboard/requests/${r.id}`,
                icon: <ShoppingCart className="h-4 w-4" />,
                category: "Requests",
              }))
            )
          }
        }
      } else if (context === "storefront" && vendorSlug) {
        const res = await fetch(`/api/store/${vendorSlug}/search?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' })
        if (res.ok) {
          const { products } = await res.json()
          if (products?.length) {
            newResults = newResults.concat(
              products.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description || "No description",
                url: `/store/${vendorSlug}/product/${p.id}`,
                icon: <Package className="h-4 w-4" />,
                category: "Products",
              }))
            )
          }
        }
      }
      setResults(newResults)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [context, vendorSlug])

  // Debounce search
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(id)
  }, [query, performSearch, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = results[selectedIndex]
      if (target) {
        addRecentSearch(query)
        onClose()
        if (context === 'storefront' && target.id === 'quick-view-cart') {
          // Open cart drawer instead of navigating
          useCartDrawerStore.getState().open()
        } else if (target.url && target.url !== '#') {
          router.push(target.url)
        }
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div
        className="mx-auto mt-24 w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-4 border-b">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={context === 'dashboard' ? 'Search products or request (customer/phone)...' : 'Search products...'}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
          <button className="text-slate-500 hover:text-slate-700" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={resultsRef} className="max-h-80 overflow-y-auto p-2">
          {isLoading && (
            <div className="p-4 text-sm text-slate-500">Searching...</div>
          )}
          {!isLoading && results.length === 0 && query.length === 0 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs uppercase text-slate-500">Recent</div>
              {recentSearches.map((q, idx) => (
                <div
                  key={q}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer"
                  onClick={() => setQuery(q)}
                >
                  <ArrowUp className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{q}</span>
                </div>
              ))}
            </div>
          )}
          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, idx) => (
                <div
                  key={r.id + idx}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-50",
                    idx === selectedIndex && "bg-slate-100"
                  )}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => { 
                    addRecentSearch(query); 
                    onClose(); 
                    if (context === 'storefront' && r.id === 'quick-view-cart') {
                      useCartDrawerStore.getState().open();
                    } else if (r.url && r.url !== '#') {
                      router.push(r.url); 
                    }
                  }}
                >
                  {r.icon}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{r.title}</div>
                    {r.description && (
                      <div className="text-xs text-slate-500 truncate">{r.description}</div>
                    )}
                  </div>
                  {r.category && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">{r.category}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {!isLoading && results.length === 0 && query.length >= 3 && (
            <div className="p-4 text-sm text-slate-500">No results found</div>
          )}
        </div>
      </div>
    </div>
  )
}
