"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Package, Search, Filter, Eye, EyeOff, Copy, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toImageUrl } from "@/lib/image-utils"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProductGridSkeleton } from "@/components/ui/loading-skeletons"
import { CategoryManager } from "@/components/dashboard/category-manager"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Product, Category } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProductsPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showInactive, setShowInactive] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
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
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({ open: false, productId: null, productTitle: "" })
  const [adjustValue, setAdjustValue] = useState("0")
  const [actionLoading, setActionLoading] = useState(false)
  const [movementDialog, setMovementDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({ open: false, productId: null, productTitle: "" })
  const [movementLoading, setMovementLoading] = useState(false)
  const [movements, setMovements] = useState<Array<{ id: string; type: string; quantity: number; created_at?: string; note?: string }>>([])

  useEffect(() => {
    loadData()
  }, [showArchived])

  const loadData = async () => {
    try {
      const vendRes = await fetch('/api/dashboard/me/vendor', { cache: 'no-store' })
      if (!vendRes.ok) return
      const vendJson = await vendRes.json()
      if (!vendJson.vendor) return
      setVendor(vendJson.vendor)

      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/dashboard/products?includeArchived=${showArchived}`, { cache: 'no-store' }),
        fetch('/api/dashboard/categories', { cache: 'no-store' })
      ])
      const prodJson = prodRes.ok ? await prodRes.json() : { products: [] }
      const catJson = catRes.ok ? await catRes.json() : { categories: [] }
      setProducts(prodJson.products || [])
      setCategories(catJson.categories || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (productId: string, productTitle: string) => {
    setDeleteDialog({ open: true, productId, productTitle })
  }

  const archiveProduct = async (productId: string, productTitle: string) => {
    if (!vendor) return
    setActionLoading(true)
    try {
      const resp = await fetch(`/api/dashboard/products/${productId}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Failed')
      setProducts(products.map(p => p.id === productId ? { ...p, is_archived: true, status: 'inactive' as any } : p))
      toastHelpers.success(`Archived "${productTitle}"`)
      setDeleteDialog({ open: false, productId: null, productTitle: "" })
    } catch (error) {
      console.error('Error archiving product:', error)
      toastHelpers.deleteError('Failed to archive product. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const restoreProduct = async (productId: string, productTitle: string) => {
    if (!vendor) return
    setActionLoading(true)
    try {
      const resp = await fetch(`/api/dashboard/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: false, status: 'draft' })
      })
      if (!resp.ok) throw new Error('Failed')
      setProducts(products.map(p => p.id === productId ? { ...p, is_archived: false, status: 'draft' as any } : p))
      toastHelpers.success(`Restored "${productTitle}"`)
    } catch (error) {
      console.error('Error restoring product:', error)
      toastHelpers.saveError('Failed to restore product. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    setActionLoading(true)
    try {
      const resp = await fetch(`/api/dashboard/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!resp.ok) throw new Error('Failed')

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

  const handleDuplicate = async (productId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/dashboard/products/${productId}/duplicate`, {
        method: 'POST'
      })
      
      if (!res.ok) throw new Error('Duplicate failed')
      
      const data = await res.json()
      toastHelpers.success('Product duplicated successfully')
      
      // Redirect to edit page of new product
      router.push(`/dashboard/products/${data.productId}/edit`)
    } catch (error) {
      console.error('Error duplicating product:', error)
      toastHelpers.saveError('Failed to duplicate product')
      setActionLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter
    const matchesVisibility = (showInactive || product.status === "active") && (showArchived || !product.is_archived)

    return matchesSearch && matchesStatus && matchesCategory && matchesVisibility
  })

  const openAdjustDialog = (productId: string, productTitle: string) => {
    setAdjustValue("0")
    setAdjustDialog({ open: true, productId, productTitle })
  }

  const submitAdjust = async () => {
    if (!adjustDialog.productId) return
    const delta = Number(adjustValue)
    if (!Number.isFinite(delta) || delta === 0) {
      toastHelpers.saveError("Enter a non-zero number to adjust stock")
      return
    }
    setActionLoading(true)
    try {
      const resp = await fetch(`/api/dashboard/products/${adjustDialog.productId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      setProducts(products.map(p => p.id === adjustDialog.productId ? { ...p, stock: data.stock } : p))
      toastHelpers.success(`Stock updated for "${adjustDialog.productTitle}"`)
      setAdjustDialog({ open: false, productId: null, productTitle: "" })
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toastHelpers.saveError('Failed to adjust stock')
    } finally {
      setActionLoading(false)
    }
  }

  const openMovements = async (productId: string, productTitle: string) => {
    setMovementDialog({ open: true, productId, productTitle })
    setMovementLoading(true)
    try {
      const resp = await fetch(`/api/dashboard/products/${productId}/movements`, { cache: 'no-store' })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      setMovements((data.movements || []).map((m: any) => ({
        id: m.id || m._id || Math.random().toString(36).slice(2),
        type: m.type,
        quantity: m.quantity,
        created_at: m.created_at,
        note: m.note
      })))
    } catch (error) {
      console.error('Error loading movements:', error)
      toastHelpers.saveError('Failed to load history')
    } finally {
      setMovementLoading(false)
    }
  }

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

            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 h-11 sm:col-span-2 lg:col-span-1"
            >
              {showArchived ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{showArchived ? "Hide Archived" : "Show Archived"}</span>
              <span className="sm:hidden">{showArchived ? "Hide" : "Show"}</span>
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
                  (() => {
                    const cover = toImageUrl(product.images[0] as any)
                    const isData = cover.startsWith('data:') || cover.startsWith('blob:')
                    return isData ? (
                      <img src={cover} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <Image src={cover} alt={product.title} fill className="object-cover" />
                    )
                  })()
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
                  {product.is_archived && (
                    <Badge variant="outline" className="ml-2 border-slate-300 text-slate-600 bg-white">
                      Archived
                    </Badge>
                  )}
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
                  {Array.isArray((product as any).variants) && (product as any).variants.length > 0 && (
                    <div className="space-y-1 rounded-md border border-slate-100 bg-slate-50 p-2">
                      <p className="text-xs font-semibold text-slate-600">Variants</p>
                      {(product as any).variants.slice(0, 3).map((v: any, idx: number) => (
                        <div key={v.id || idx} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="truncate max-w-[180px]">
                            {v.sku || 'Variant'} {v.attributes ? `• ${Object.entries(v.attributes).map(([k, val]) => `${k}:${val}`).join(', ')}` : ''}
                          </span>
                          <span className="font-semibold">{typeof v.stock === 'number' ? v.stock : 0}</span>
                        </div>
                      ))}
                      {(product as any).variants.length > 3 && (
                        <p className="text-[11px] text-slate-500">+{(product as any).variants.length - 3} more</p>
                      )}
                    </div>
                  )}
                  {product.safety_stock !== undefined && product.stock <= (product.safety_stock || 0) && !product.is_archived && (
                    <Badge className="w-fit bg-amber-500 text-white">Low stock</Badge>
                  )}
                  {product.allow_backorder && (
                    <Badge variant="outline" className="w-fit border-blue-200 text-blue-700 bg-blue-50">Backorders allowed</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      {(() => {
                        const rawUnit = (product as any)?.attributes?.price_unit || product.unit
                        const unitLabel = (() => {
                          switch (rawUnit) {
                            case 'yard':
                              return 'yards'
                            case 'meter':
                              return 'meters'
                            case 'lb':
                              return 'lbs'
                            case 'piece':
                              return 'pieces'
                            case 'set':
                              return 'sets'
                            case 'box':
                              return 'boxes'
                            case 'pack':
                              return 'packs'
                            case 'dozen':
                              return 'dozen'
                            case 'kg':
                            case 'unit':
                            default:
                              return rawUnit || undefined
                          }
                        })()
                        const stockRawUnit = (product as any)?.attributes?.stock_unit || 'units'
                        const stockUnitLabel = (() => {
                          switch (stockRawUnit) {
                            case 'yard':
                              return 'yards'
                            case 'meter':
                              return 'meters'
                            case 'lb':
                              return 'lbs'
                            case 'piece':
                              return 'pieces'
                            case 'set':
                              return 'sets'
                            case 'box':
                              return 'boxes'
                            case 'pack':
                              return 'packs'
                            case 'dozen':
                              return 'dozen'
                            case 'kg':
                            case 'units':
                            case 'unit':
                            default:
                              return stockRawUnit || 'units'
                          }
                        })()
                        return (
                          <>
                            <p className="text-2xl font-bold text-slate-800">
                              ₦{Number(product.price).toLocaleString()}
                              {unitLabel && (
                                <span className="text-sm font-normal text-slate-500 ml-1">/ {unitLabel}</span>
                              )}
                            </p>
                            {product.stock > 0 && product.stock < 5 && (
                              <p className="text-sm text-amber-700">
                                Low stock: {product.stock} {stockUnitLabel}
                              </p>
                            )}
                          </>
                        )
                      })()}
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
                            <span className="font-medium">{key}:</span> {Array.isArray(value) ? value.join(', ') : String(value)}
                          </div>
                        ))}
                      {Object.keys(product.attributes).length > 2 && (
                        <div className="text-xs text-slate-500">
                          +{Object.keys(product.attributes).length - 2} more attributes
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      asChild
                      className="flex-1 h-9 bg-white hover:bg-slate-50 border-slate-200"
                      disabled={product.is_archived}
                    >
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2 text-slate-500" />
                        <span>Edit</span>
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(product.id)}
                      className="flex-1 h-9 bg-white hover:bg-slate-50 border-slate-200"
                      disabled={actionLoading || product.is_archived}
                      title="Duplicate Product"
                    >
                      <Copy className="h-4 w-4 mr-2 text-slate-500" />
                      <span>Duplicate</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {!product.is_archived && (
                          <DropdownMenuItem onClick={() => handleStatusClick(product.id, product.title, product.status)}>
                            {product.status === 'active' ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                <span>Hide from Store</span>
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Show in Store</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openAdjustDialog(product.id, product.title)}>
                          <span>Adjust Stock</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMovements(product.id, product.title)}>
                          <span>Stock History</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.is_archived ? (
                          <DropdownMenuItem onClick={() => restoreProduct(product.id, product.title)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Restore Product</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteClick(product.id, product.title)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Archive Product</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                <p className="text-2xl font-bold text-blue-900">{products.filter(p => !p.is_archived).length}</p>
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
                  {products.filter(p => p.status === 'active' && !p.is_archived).length}
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
                  {products.filter(p => p.status === 'draft' && !p.is_archived).length}
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
                  {products.filter(p => !p.is_archived).reduce((sum, p) => sum + p.stock, 0)}
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
        title="Archive Product"
        description={`Are you sure you want to archive "${deleteDialog.productTitle}"? You can restore it later.`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => deleteDialog.productId && archiveProduct(deleteDialog.productId, deleteDialog.productTitle)}
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={adjustDialog.open}
        onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}
        title="Adjust Stock"
        description={`Enter a positive number to add stock or negative to remove for "${adjustDialog.productTitle}".`}
        confirmText="Update Stock"
        cancelText="Cancel"
        onConfirm={submitAdjust}
        loading={actionLoading}
      >
        <div className="pt-4">
          <Input
            type="number"
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            placeholder="e.g. 5 or -3"
          />
        </div>
      </ConfirmationDialog>

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

      <Dialog open={movementDialog.open} onOpenChange={(open) => setMovementDialog({ ...movementDialog, open })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription>{movementDialog.productTitle || 'Product'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {movementLoading ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-slate-500">No movements recorded yet.</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="flex items-start justify-between rounded-md border p-2">
                  <div>
                    <p className="font-medium text-slate-800 capitalize">{m.type}</p>
                    {m.note && <p className="text-xs text-slate-500 mt-1">{m.note}</p>}
                    {m.created_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${m.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialog({ open: false, productId: null, productTitle: "" })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
