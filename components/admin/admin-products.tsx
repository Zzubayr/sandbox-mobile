"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Product, Vendor } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Package,
  Search,
  RefreshCcw,
  CheckCircle,
  Circle,
  Eye,
  AlertTriangle,
  Store,
  Tags,
} from "lucide-react"
import { toastHelpers } from "@/lib/toast-helpers"

type ProductWithVendor = Product & {
  vendor?: Pick<Vendor, "id" | "store_name" | "store_slug" | "email" | "theme_color" | "approval_status">
}

const statusBadge: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-amber-100 text-amber-700",
  draft: "bg-slate-100 text-slate-700",
}

function formatCurrency(value: number) {
  if (Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value)
}

function formatDateTime(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

export function AdminProducts({ initialProducts = [] as ProductWithVendor[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithVendor[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "draft">("all")

  const refreshProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Unable to load products")
      setProducts(data.products || [])
    } catch (error: any) {
      console.error("Failed to load products", error)
      toastHelpers.error("Load failed", error?.message || "Could not load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialProducts.length) {
      void refreshProducts()
    }
  }, [initialProducts.length])

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const haystack = [
        product.title,
        product.description,
        product.vendor?.store_name,
        product.vendor?.store_slug,
        product.vendor?.email,
        product.status,
      ]
        .join(" ")
        .toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" ? true : product.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [products, search, statusFilter])

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.status === "active").length,
      inactive: products.filter((p) => p.status === "inactive").length,
      draft: products.filter((p) => p.status === "draft").length,
    }
  }, [products])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full w-fit">
            <Package className="h-4 w-4" /> Products
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Catalog (Admin)</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Review every product submitted by vendors and drill into details quickly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshProducts} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Circle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title, vendor, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "active", "inactive", "draft"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filtered.map((product) => (
          <Card key={product.id} className="shadow-sm border border-slate-100">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Tags className="h-3.5 w-3.5 text-slate-400" />
                    {product.category_id ? `Category: ${product.category_id}` : "Uncategorised"}
                  </p>
                  <h3 className="text-lg font-semibold">{product.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={statusBadge[product.status] || "bg-slate-100 text-slate-700"}>
                      {product.status}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs text-slate-500">Stock: {product.stock}</span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-slate-400" />
                  <span>{product.vendor?.store_name || "Unknown vendor"}</span>
                </div>
                <span>{formatDateTime(product.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-slate-600">
              No products found. Try a different search or status filter.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Products</CardTitle>
          <div className="text-sm text-slate-500">{filtered.length} shown</div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{product.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {product.vendor?.store_name || "Unknown vendor"}
                        </p>
                        {product.vendor?.store_slug && (
                          <p className="text-xs text-slate-500">/{product.vendor.store_slug}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge[product.status] || "bg-slate-100 text-slate-700"}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">{formatDateTime(product.created_at)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No products found. Adjust your filters to see more results.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
