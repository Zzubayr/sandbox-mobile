"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, Package, ShoppingCart, Filter, X } from "lucide-react"
import Link from "next/link"
import { CloudinaryImage } from "@/components/ui/cloudinary-image"
import { useTheme } from "@/lib/theme-context"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Product, Category } from "@/lib/types"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { colors } = useTheme()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      router.push("/auth/login")
      return
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (vendorError || !vendorData) {
      router.push("/auth/login")
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

      // Add search filters
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

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
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSearch} className="flex-1">
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-6">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Search Your Products</h2>
            <p className="text-slate-600 mb-8">Enter a product name or description to find what you're looking for</p>
            
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Try searching for 'headphones' or 'wireless'..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-center"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
                className="mt-4 w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Search Products
              </Button>
            </div>
          </div>
        ) : loading ? (
          /* Loading State */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-6 animate-pulse">
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
                  className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 search-results-stagger"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-square relative bg-gradient-to-br from-slate-50 to-slate-100">
                    {product.images && product.images.length > 0 ? (
                      <CloudinaryImage
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                        quality="auto"
                        crop="fill"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {product.status}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold line-clamp-2 text-slate-800">
                          {product.title}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold" style={{ color: colors.primary }}>
                            ${product.price}
                          </p>
                          <p className="text-xs text-slate-500">
                            Stock: {product.stock}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Package className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full mb-6">
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
