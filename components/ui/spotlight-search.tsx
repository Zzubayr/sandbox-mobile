"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Package, User, ShoppingCart, X, ArrowUp, ArrowDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSpotlightSearch } from "@/hooks/use-spotlight-search"
import { createClient } from "@/lib/supabase/client"
import type { Product, Request, Vendor } from "@/lib/types"
import { toastHelpers } from "@/lib/toast-helpers"

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
  
  // Create fresh Supabase client for each search to avoid caching
  const getFreshSupabaseClient = useCallback(() => {
    return createClient()
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery("") // Clear query on open
      setResults([]) // Clear results on open
      setSelectedIndex(0) // Reset selected index
    }
  }, [isOpen])

  // Save recent searches to localStorage
  const addRecentSearch = useCallback((newQuery: string) => {
    if (!newQuery.trim()) return
    setRecentSearches((prev) => {
      const updated = [newQuery, ...prev.filter((q) => q !== newQuery)].slice(0, 5) // Keep max 5
      localStorage.setItem("recent-searches", JSON.stringify(updated))
      return updated
    })
  }, [])

  // Handle search logic with timeout and optimization
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    // For very short queries (1-2 characters), show helpful notice
    if (searchQuery.length <= 2) {
      const tipResults = [
        {
          id: "search-tip-short",
          title: "Type at least 3 characters to search",
          description: `You've typed ${searchQuery.length} character${searchQuery.length === 1 ? '' : 's'}. Enter more to search products.`,
          url: "#",
          icon: <Search className="h-4 w-4" />,
          category: "Tip",
        }
      ]
      
      // Add quick access options for short queries
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
    setResults([]) // Clear previous results
    setSelectedIndex(0) // Reset selection

    // Add cache-busting timestamp and clear any potential cache
    const cacheBuster = Date.now()
    console.log("🔄 Search with cache buster:", cacheBuster, "for query:", searchQuery)
    
    // Clear any potential cached results
    setResults([])

    try {
      let newResults: SearchResult[] = []
      
      // Get fresh Supabase client to avoid caching
      const supabase = getFreshSupabaseClient()

      // Create a timeout promise with reasonable timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 15000)
      )

      if (context === "dashboard") {
        // Search products (no cache, no abort signal for short queries)
        const productSearchPromise = supabase
          .from("products")
          .select("id, title, description, images")
          .ilike("title", `%${searchQuery}%`)
          .limit(5)

        try {
          const { data: products, error: productError } = await Promise.race([
            productSearchPromise,
            timeoutPromise
          ]) as any

          if (productError) {
            console.error("Product search error:", productError)
          } else if (products) {
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
        } catch (error) {
          console.error("Product search timeout or error:", error)
        }

        // Search requests (only if query is long enough, no cache, no abort signal)
        if (searchQuery.length >= 3) {
          const requestSearchPromise = supabase
            .from("requests")
            .select("id, customer_name, customer_phone, created_at")
            .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`)
            .limit(5)

          try {
            const { data: requests, error: requestError } = await Promise.race([
              requestSearchPromise,
              timeoutPromise
            ]) as any

            if (requestError) {
              console.error("Request search error:", requestError)
            } else if (requests) {
              newResults = newResults.concat(
                requests.map((r: any) => ({
                  id: r.id,
                  title: `Request #${r.id.substring(0, 8)}`,
                  description: `From ${r.customer_name || "N/A"} (${r.customer_phone || "N/A"})`,
                  url: `/dashboard/requests/${r.id}`,
                  icon: <ShoppingCart className="h-4 w-4" />,
                  category: "Requests",
                }))
              )
            }
          } catch (error) {
            console.error("Request search timeout or error:", error)
          }
        }

        // Search customers (mock for now)
        if ("customer".includes(searchQuery.toLowerCase())) {
          newResults.push({
            id: "mock-customer-1",
            title: "John Doe",
            description: "Customer since 2023",
            url: "/dashboard/customers/1",
            icon: <User className="h-4 w-4" />,
            category: "Customers",
          })
        }
      } else if (context === "storefront" && vendorSlug) {
        console.log("🔍 Storefront search for vendor:", vendorSlug, "query:", searchQuery, "cache-buster:", cacheBuster)
        console.log("🔍 Current URL:", window.location.pathname)
        
        // First get the vendor_id from the store_slug (no cache, no abort signal)
        const vendorLookupPromise = supabase
          .from("vendors")
          .select("id, store_name, store_slug")
          .eq("store_slug", vendorSlug)
          .eq("is_active", true)
          .single()

        try {
          const { data: vendorData, error: vendorError } = await Promise.race([
            vendorLookupPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Vendor lookup timeout')), 10000))
          ]) as any

          if (vendorError) {
            console.error("Vendor lookup error:", vendorError)
            newResults.push({
              id: "vendor-not-found",
              title: "Store not found",
              description: "Unable to find this store",
              url: "#",
              icon: <Package className="h-4 w-4" />,
              category: "Error",
            })
          } else if (vendorData) {
            console.log("✅ Found vendor:", vendorData.store_name, "ID:", vendorData.id, "Slug:", vendorData.store_slug)
            console.log("🔍 Verifying vendor slug matches:", vendorData.store_slug === vendorSlug)
            
            // Search products for the specific vendor (no cache, no abort signal)
            const productSearchPromise = supabase
              .from("products")
              .select("id, title, description, images, vendor_id")
              .eq("vendor_id", vendorData.id)
              .eq("status", "active")
              .ilike("title", `%${searchQuery}%`)
              .limit(10)

            // Debug: Also check if there are any products at all for this vendor (no cache)
            const debugPromise = supabase
              .from("products")
              .select("id, title")
              .eq("vendor_id", vendorData.id)
              .limit(5)

            const { data: products, error: productError } = await Promise.race([
              productSearchPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Product search timeout')), 10000))
            ]) as any

            // Debug: Check all products for this vendor
            try {
              const { data: allProducts } = await debugPromise
              console.log("All products for vendor:", allProducts?.length || 0, allProducts)
            } catch (debugError) {
              console.error("Debug query error:", debugError)
            }

            if (productError) {
              console.error("Storefront product search error:", productError)
              newResults.push({
                id: "search-error",
                title: "Search temporarily unavailable",
                description: "Please try again in a moment",
                url: "#",
                icon: <Package className="h-4 w-4" />,
                category: "Error",
              })
            } else if (products && products.length > 0) {
              console.log("✅ Found products:", products.length)
              console.log("🔍 Product vendor IDs:", products.map((p: any) => p.vendor_id))
              console.log("🔍 Expected vendor ID:", vendorData.id)
              
              // Double-check that all products belong to the correct vendor
              const validProducts = products.filter((p: any) => p.vendor_id === vendorData.id)
              console.log("🔍 Valid products after filtering:", validProducts.length)
              
              newResults = newResults.concat(
                validProducts.map((p: any) => ({
                  id: p.id,
                  title: p.title,
                  description: p.description || "No description",
                  url: `/store/${vendorSlug}/product/${p.id}`,
                  icon: <Package className="h-4 w-4" />,
                  category: "Products",
                }))
              )
            } else {
              console.log("No products found for query:", searchQuery)
              newResults.push({
                id: "no-products",
                title: "No products found",
                description: `No products match "${searchQuery}" in this store`,
                url: "#",
                icon: <Package className="h-4 w-4" />,
                category: "Info",
              })
            }
          }
        } catch (error) {
          console.error("Vendor lookup or product search timeout/error:", error)
          newResults.push({
            id: "search-timeout",
            title: "Search timeout",
            description: "Please try again with a shorter query",
            url: "#",
            icon: <Package className="h-4 w-4" />,
            category: "Error",
          })
        }
      }

      setResults(newResults)
      
      // If no results and search is short, show some fallback suggestions
      if (newResults.length === 0 && searchQuery.length < 3) {
        setResults([
          {
            id: "search-tip-1",
            title: "Type at least 3 characters to search",
            description: `You've typed ${searchQuery.length} character${searchQuery.length === 1 ? '' : 's'}. Enter more to search products.`,
            url: "#",
            icon: <Search className="h-4 w-4" />,
            category: "Tip",
          }
        ])
      }
    } catch (error) {
      console.error("Search error:", error)
      
      // Provide more specific error messages
      let errorMessage = "Search temporarily unavailable"
      let errorDescription = "Please try again in a moment"
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Search timeout"
          errorDescription = "The search is taking too long. Please try a shorter query."
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Connection error"
          errorDescription = "Unable to connect to the server. Please check your internet connection."
        }
      }
      
      setResults([
        {
          id: "search-error-1",
          title: errorMessage,
          description: errorDescription,
          url: "#",
          icon: <Search className="h-4 w-4" />,
          category: "Error",
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [context, vendorSlug, getFreshSupabaseClient])

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query)
    }, 300) // Increased to 300ms to reduce rapid queries

    return () => {
      clearTimeout(handler)
    }
  }, [query, performSearch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
        resultsRef.current?.children[selectedIndex + 1]?.scrollIntoView({ block: "nearest" })
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        resultsRef.current?.children[selectedIndex - 1]?.scrollIntoView({ block: "nearest" })
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (results[selectedIndex]) {
          addRecentSearch(query)
          router.push(results[selectedIndex].url)
          onClose()
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, results, selectedIndex, router, onClose, query, addRecentSearch])

  // Handle recent search click
  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm spotlight-backdrop-blur"
        onClick={onClose}
      />

      {/* Search Container */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden spotlight-fade-in">
          {/* Search Input */}
          <div className="flex items-center px-6 py-4 border-b border-gray-100">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder={context === "dashboard" ? "Search products, requests, customers..." : "Search products..."}
              className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

                      {/* Search Results / Quick Access / Recent Searches */}
                      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                        {isLoading && query ? (
                          <div className="p-6 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                              Searching...
                            </div>
                          </div>
                        ) : results.length > 0 ? (
              <div ref={resultsRef} className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      if (result.url !== "#") {
                        addRecentSearch(query)
                        router.push(result.url)
                        onClose()
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors",
                      selectedIndex === index && "bg-gray-100",
                      result.url === "#" && "cursor-default"
                    )}
                  >
                    <div className="text-gray-500">{result.icon}</div>
                    <div>
                      <p className="font-medium text-gray-800">{result.title}</p>
                      <p className="text-sm text-gray-500">{result.description}</p>
                    </div>
                    {result.category && (
                      <span className="ml-auto text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-full">
                        {result.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : query && !isLoading ? (
              <div className="p-6 text-center text-gray-500">No results found for "{query}"</div>
            ) : (
              // Quick Access + Recent Searches
              <div className="py-2">
                {/* Quick Access */}
                <div className="mb-4">
                  <p className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase">Quick Access</p>
                  {context === "dashboard" ? (
                    <>
                      <button
                        onClick={() => {
                          router.push('/dashboard/products/new')
                          onClose()
                        }}
                        className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <Package className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">Add New Product</p>
                          <p className="text-sm text-gray-500">Create a new product</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          router.push('/dashboard/products')
                          onClose()
                        }}
                        className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <Package className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">View All Products</p>
                          <p className="text-sm text-gray-500">Manage your products</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          router.push('/dashboard/settings')
                          onClose()
                        }}
                        className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">Store Settings</p>
                          <p className="text-sm text-gray-500">Configure your store</p>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          router.push(`/store/${vendorSlug}`)
                          onClose()
                        }}
                        className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <Package className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">Browse All Products</p>
                          <p className="text-sm text-gray-500">View all available products</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/store/${vendorSlug}/cart`)
                          onClose()
                        }}
                        className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">View Cart</p>
                          <p className="text-sm text-gray-500">Check your cart items</p>
                        </div>
                      </button>
                    </>
                  )}
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <p className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase">Recent</p>
                    {recentSearches.map((recentQuery, index) => (
                      <button
                        key={recentQuery}
                        onClick={() => handleRecentClick(recentQuery)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-gray-50 transition-colors",
                          selectedIndex === index && "bg-gray-100"
                        )}
                      >
                        <Search className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-gray-800">{recentQuery}</p>
                        <span className="ml-auto text-xs text-gray-400">Recent</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}