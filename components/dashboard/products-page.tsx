"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/lib/theme-context"
import { Plus, Edit, Trash2, Package, Search, Filter, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProductGridSkeleton } from "@/components/ui/loading-skeletons"
import { CategoryManager } from "@/components/dashboard/category-manager"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Product, Category } from "@/lib/types"

export default function ProductsPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showInactive, setShowInactive] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({
    open: false,
    productId: null,
    productTitle: ""
  })
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; productId: string | null; productTitle: string; newStatus: string }>({
    open: false,
    productId: null,
    productTitle: "",
    newStatus: ""
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get vendor info
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!vendorData) return

      setVendor(vendorData)

      // Get products and categories
      const [
        { data: productsData },
        { data: categoriesData }
      ] = await Promise.all([
        supabase
          .from("products")
          .select(`
            *,
            category:categories (name)
          `)
          .eq("vendor_id", vendorData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("vendor_id", vendorData.id)
          .order("name")
      ])

      setProducts(productsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!vendor) return

    setActionLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("vendor_id", vendor.id)

      if (error) throw error

      setProducts(products.filter(p => p.id !== productId))
      setDeleteDialog({ open: false, productId: null, productTitle: "" })
      toastHelpers.productDeleted(deleteDialog.productTitle)
    } catch (error) {
      console.error('Error deleting product:', error)
      toastHelpers.deleteError('Failed to delete product. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClick = (productId: string, productTitle: string) => {
    setDeleteDialog({ open: true, productId, productTitle })
  }

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    setActionLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId)

      if (error) throw error

      setProducts(products.map(p => 
        p.id === productId ? { ...p, status: newStatus as any } : p
      ))
      setStatusDialog({ open: false, productId: null, productTitle: "", newStatus: "" })
      toastHelpers.productStatusChanged(statusDialog.productTitle, newStatus)
    } catch (error) {
      console.error('Error updating product status:', error)
      toastHelpers.saveError('Failed to update product status. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusClick = (productId: string, productTitle: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setStatusDialog({ open: true, productId, productTitle, newStatus })
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter
    const matchesVisibility = showInactive || product.status === "active"

    return matchesSearch && matchesStatus && matchesCategory && matchesVisibility
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-600">Manage your product catalog</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Category Manager */}
      {vendor && !loading && (
        <CategoryManager 
          vendorId={vendor.id} 
          onCategoriesChange={setCategories}
        />
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center gap-2 h-11 sm:col-span-2 lg:col-span-1"
            >
              {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{showInactive ? "Hide Inactive" : "Show Inactive"}</span>
              <span className="sm:hidden">{showInactive ? "Hide" : "Show"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-square relative bg-gradient-to-br from-slate-50 to-slate-100">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant={product.status === "active" ? "default" : "secondary"}
                    className={
                      product.status === "active" 
                        ? "bg-green-500 text-white" 
                        : product.status === "draft"
                          ? "bg-yellow-500 text-white"
                          : "bg-slate-500 text-white"
                    }
                  >
                    {product.status}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  {product.category && (
                    <Badge variant="outline" className="w-fit">
                      {product.category.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-800">
                        ${product.price}
                        {product.attributes?.price_unit && (
                          <span className="text-sm font-normal text-slate-500 ml-1">
                            / {product.attributes.price_unit}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        Stock: {product.stock} {product.attributes?.stock_unit || 'units'}
                      </p>
                    </div>
                  </div>

                  {/* Attributes Preview */}
                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(product.attributes)
                        .filter(([key]) => !['price_unit', 'stock_unit'].includes(key))
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="text-xs text-slate-600">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      {Object.keys(product.attributes).length > 2 && (
                        <div className="text-xs text-slate-500">
                          +{Object.keys(product.attributes).length - 2} more attributes
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      asChild
                      className="flex-1 h-10"
                    >
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusClick(product.id, product.title, product.status)}
                      className="flex-1 h-10"
                      disabled={actionLoading}
                    >
                      {product.status === 'active' ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Show</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(product.id, product.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 min-w-[44px]"
                      disabled={actionLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 mb-4">
              <Package className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-800">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                ? "No products found" 
                : "No products yet"}
            </h3>
            <p className="text-slate-600 text-center mb-6 max-w-md">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start building your catalog by adding your first product"}
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
              <Link href="/dashboard/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Products</p>
                <p className="text-2xl font-bold text-blue-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Active Products</p>
                <p className="text-2xl font-bold text-green-900">
                  {products.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Draft Products</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {products.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Stock</p>
                <p className="text-2xl font-bold text-purple-900">
                  {products.reduce((sum, p) => sum + p.stock, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteDialog.productTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => deleteDialog.productId && deleteProduct(deleteDialog.productId)}
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}
        title={`${statusDialog.newStatus === 'active' ? 'Show' : 'Hide'} Product`}
        description={`Are you sure you want to ${statusDialog.newStatus === 'active' ? 'show' : 'hide'} "${statusDialog.productTitle}"?`}
        confirmText={statusDialog.newStatus === 'active' ? 'Show' : 'Hide'}
        cancelText="Cancel"
        onConfirm={() => statusDialog.productId && toggleProductStatus(statusDialog.productId, statusDialog.newStatus === 'active' ? 'inactive' : 'active')}
        loading={actionLoading}
      />
    </div>
  )
}
