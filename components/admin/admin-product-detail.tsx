"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Product, Vendor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Package,
  Store,
  Calendar,
  DollarSign,
  Boxes,
  Tags,
  Mail,
  Eye,
} from "lucide-react"

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

function normalizeImageSrc(img: any): string | null {
  if (!img) return null
  if (typeof img === "string") return img
  if (typeof img === "object" && typeof img.url === "string") return img.url
  return null
}

export function AdminProductDetail({ product }: { product: ProductWithVendor }) {
  const router = useRouter()
  const imageSources = (product.images || []).map(normalizeImageSrc).filter(Boolean) as string[]
  const attributeEntries = Object.entries(product.attributes || {}).filter(([_, value]) => value !== undefined && value !== null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              <Package className="h-3.5 w-3.5" />
              Product Detail
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{product.title}</h1>
            <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusBadge[product.status] || "bg-slate-100 text-slate-700"}>{product.status}</Badge>
          <Badge variant="outline">{product.category_id ? `Category: ${product.category_id}` : "Uncategorised"}</Badge>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(product.price)}</div>
            <p className="text-xs text-slate-500">Listed selling price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock</CardTitle>
            <Boxes className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.stock}</div>
            <p className="text-xs text-slate-500">Inventory available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700">
              <p>Created: {product.created_at ? new Date(product.created_at).toLocaleString() : "—"}</p>
              <p>Updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imageSources.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageSources.slice(0, 6).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="relative w-full overflow-hidden rounded-lg border bg-slate-50">
                      <Image
                        src={src}
                        alt={product.title}
                        width={400}
                        height={300}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">Description</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {product.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-800">Colors</h3>
                  {product.colors?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <span
                          key={color}
                          className="rounded-full px-3 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Not specified</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-800">Sizes</h3>
                  {product.sizes?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <span
                          key={size}
                          className="rounded-full px-3 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Not specified</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">Attributes</h3>
                {attributeEntries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attributeEntries.map(([key, value]) => (
                      <div key={key} className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{key}</p>
                        <p className="text-sm font-medium text-slate-900 break-words">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No extra attributes provided.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Vendor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {product.vendor?.store_name || "Unknown vendor"}
                </p>
                <p className="text-xs text-slate-500">
                  {product.vendor?.store_slug ? `/${product.vendor.store_slug}` : "No slug"}
                </p>
              </div>
              {product.vendor?.email && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{product.vendor.email}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Theme: {product.vendor?.theme_color || "n/a"}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700">
                  Status: {product.vendor?.approval_status || "unknown"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {product.vendor?.id && (
                  <Button asChild variant="outline">
                    <Link href={`/admin/vendors/${product.vendor.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Vendor Profile
                    </Link>
                  </Button>
                )}
                {product.vendor?.store_slug && (
                  <Button asChild variant="secondary">
                    <Link href={`/store/${product.vendor.store_slug}`} target="_blank">
                      <Store className="h-4 w-4 mr-2" />
                      Open Storefront
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="text-slate-500">Product ID:</span>{" "}
                <span className="font-mono text-xs">{product.id}</span>
              </p>
              <p>
                <span className="text-slate-500">Vendor ID:</span>{" "}
                <span className="font-mono text-xs">{product.vendor_id}</span>
              </p>
              {product.weight && (
                <p>
                  <span className="text-slate-500">Weight:</span> {product.weight}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
