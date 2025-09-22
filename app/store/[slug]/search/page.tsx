"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, Package, ShoppingCart, Filter, X, Heart } from "lucide-react"
import Link from "next/link"
import { CloudinaryImage } from "@/components/ui/cloudinary-image"
import { getThemeColors } from "@/lib/theme-colors"
import { useCart } from "@/lib/cart-context"
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Product, Category } from "@/lib/types"

interface SearchPageProps {
  params: {
    slug: string
  }
}

export default function SearchPage({ params }: SearchPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const { dispatch } = useCart()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Focus search input on mount
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    // Auto-search if there's a query parameter
    if (searchParams.get('q')) {
      handleSearch()
    }
  }, [searchParams])

  const loadData = async () => {
    const supabase = createClient()

    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("store_slug", params.slug)
      .single()

    if (vendorError || !vendorData) {
      router.push("/")
      return
    }

    setVendor(vendorData)

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("vendor_id", vendorData.id)
      .order("name")

    setCategories(categoriesData || [])
  }

  const handleSearch = async () => {
    if (!searchTerm.trim() || !vendor) return

    setLoading(true)
    setHasSearched(true)

    try {
      const supabase = createClient()
      
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories (name)
        `)
        .eq("vendor_id", vendor.id)
        .eq("status", "active") // Only show active products to customers

      // Add search filters
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      const { data: productsData, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      setProducts(productsData || [])
      
      // Show toast notification for search results
      if (productsData && productsData.length > 0) {
        toastHelpers.searchCompleted(productsData.length)
      } else {
        toastHelpers.noSearchResults()
      }
    } catch (error) {
      console.error('Error searching products:', error)
      toastHelpers.error('Search Failed', 'Failed to search products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setProducts([])
    setHasSearched(false)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleAddToCart = (product: Product) => {
    dispatch.addItem(product, 1)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter

    return matchesSearch && matchesCategory
  })

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="min-w-[44px] min-h-[44px]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10 h-12 text-lg search-input-transition"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="min-w-[44px] min-h-[44px]"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border search-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSearch} className="flex-1" style={{ backgroundColor: colors.primary }}>
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCategoryFilter('all')
                    setShowFilters(false)
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {!hasSearched ? (
          /* Search Prompt */
          <div className="text-center py-12 search-fade-in">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              <Search className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Search {vendor.store_name}</h2>
            <p className="text-slate-600 mb-8">Find the perfect products for you</p>
            
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-center"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
                className="mt-4 w-full h-12"
                style={{ backgroundColor: colors.primary }}
              >
                Search Products
              </Button>
            </div>
          </div>
        ) : loading ? (
          /* Loading State */
          <div className="text-center py-12">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 animate-pulse"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              <Search className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Searching...</h2>
            <p className="text-slate-600">Finding products that match your search</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          /* Search Results */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Search Results
                </h2>
                <p className="text-slate-600">
                  Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} for "{searchTerm}"
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 search-results-stagger"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Link href={`/store/${vendor.store_slug}/product/${product.id}`}>
                    <div className="aspect-square relative bg-gray-100 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <CloudinaryImage
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          quality="auto"
                          crop="fill"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <ShoppingCart className="h-8 w-8 md:h-12 md:w-12" />
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>

                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2">
                      <Link href={`/store/${vendor.store_slug}/product/${product.id}`}>
                        <h3 className="font-semibold line-clamp-2 hover:underline text-sm md:text-base leading-tight">
                          {product.title}
                        </h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base md:text-lg font-bold truncate" style={{ color: colors.primary }}>
                            ${product.price}
                          </p>
                          {product.stock > 0 && (
                            <p className="text-xs text-muted-foreground hidden md:block">In Stock: {product.stock}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={product.stock === 0}
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddToCart(product)
                          }}
                          style={{ backgroundColor: colors.primary }}
                          className="hover:opacity-90 text-xs md:text-sm px-3 md:px-4 min-w-[44px] min-h-[44px] flex-shrink-0"
                        >
                          <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                          <span className="hidden sm:inline">Add to Cart</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-12">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              <Search className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No products found</h2>
            <p className="text-slate-600 mb-8">
              We couldn't find any products matching "{searchTerm}". Try adjusting your search terms or filters.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={clearSearch}
                className="min-w-[44px] min-h-[44px]"
              >
                Clear Search
              </Button>
              <Button 
                onClick={() => setShowFilters(true)}
                className="min-w-[44px] min-h-[44px]"
                style={{ backgroundColor: colors.primary }}
              >
                Adjust Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
