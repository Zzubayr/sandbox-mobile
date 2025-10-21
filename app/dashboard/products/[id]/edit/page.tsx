"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, ImageIcon } from "lucide-react"
import { getContrastingTextColor } from "@/lib/color-utils"
import Link from "next/link"
import CloudinaryUploadDeferred, { type PendingFile } from "@/components/ui/cloudinary-upload-deferred"
import { uploadImageWithMeta } from "@/lib/cloudinary"
import { AttributeEditor } from "@/components/dashboard/attribute-editor"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Category, Product } from "@/lib/types"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [catSaving, setCatSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    price_unit: "unit",
    stock_unit: "unit",
    category_id: "",
    images: [] as (string | { url: string; public_id?: string })[],
    attributes: {} as Record<string, any>,
    status: "active" as "active" | "inactive" | "draft",
  })
  // Local UI state for weight inputs to avoid DOM querying
  const [weightVal, setWeightVal] = useState("")
  const [weightUnit, setWeightUnit] = useState<"kg" | "g" | "lb">("kg")

  // Variants helpers merged into attributes UI
  const addColor = (name: string) => {
    const val = name.trim()
    if (!val) return
    const current: string[] = Array.isArray(formData.attributes.colors) ? formData.attributes.colors : []
    if (current.includes(val)) return
    setFormData((prev) => ({ ...prev, attributes: { ...prev.attributes, colors: [...current, val] } }))
  }
  const removeColor = (name: string) => {
    const current: string[] = Array.isArray(formData.attributes.colors) ? formData.attributes.colors : []
    setFormData((prev) => ({ ...prev, attributes: { ...prev.attributes, colors: current.filter((c) => c !== name) } }))
  }
  const toggleSize = (size: string) => {
    const current: string[] = Array.isArray(formData.attributes.sizes) ? formData.attributes.sizes : []
    const set = new Set(current)
    if (set.has(size)) set.delete(size); else set.add(size)
    setFormData((prev) => ({ ...prev, attributes: { ...prev.attributes, sizes: Array.from(set) } }))
  }
  const setWeight = (value: string, unit: string) => {
    const val = value.trim()
    const final = val ? `${val} ${unit}` : ""
    setFormData((prev) => ({ ...prev, attributes: { ...prev.attributes, weight: final } }))
  }

  useEffect(() => {
    async function fetchData() {
      const { data: session } = await authClient.getSession()
      if (!session?.user) {
        router.push("/auth/login")
        return
      }

      const vendorRes = await fetch('/api/dashboard/vendor', { cache: 'no-store' })
      if (vendorRes.status === 401) {
        router.push("/auth/login")
        return
      }
      const { vendor: vendorData } = await vendorRes.json()
      if (!vendorData) {
        router.push("/onboarding")
        return
      }
      setVendor(vendorData)

      const productRes = await fetch(`/api/dashboard/products/${productId}`, { cache: 'no-store' })
      if (!productRes.ok) {
        router.push("/dashboard/products")
        return
      }
      const { product: productData } = await productRes.json()
      setProduct(productData)

      setFormData({
        title: productData.title,
        description: productData.description || "",
        price: String(productData.price ?? ""),
        stock: String(productData.stock ?? ""),
        price_unit: productData.attributes?.price_unit || "unit",
        stock_unit: productData.attributes?.stock_unit || "unit",
        category_id: productData.category_id || "",
        images: productData.images || [],
        attributes: productData.attributes || {},
        status: productData.status,
      })

      const catsRes = await fetch('/api/dashboard/categories', { cache: 'no-store' })
      if (catsRes.ok) {
        const { categories: categoriesData } = await catsRes.json()
        setCategories(categoriesData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [router, productId])

  const removeImageByIndex = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }
  const onSelectPending = (files: PendingFile[]) => {
    const currentTotal = formData.images.length + pendingFiles.length
    const remaining = Math.max(0, 5 - currentTotal)
    const next = remaining > 0 ? files.slice(0, remaining) : []
    if (next.length > 0) setPendingFiles((prev) => [...prev, ...next])
  }
  const onRemovePending = (previewUrl: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.previewUrl !== previewUrl))
    try { URL.revokeObjectURL(previewUrl) } catch {}
  }

  const handleSave = async () => {
    if (!vendor || !product) return
    setSaving(true)
    try {
      const folder = `vendors/${vendor.id}/products/${productId}`
      const uploaded: { url: string; public_id: string }[] = []
      for (let i = 0; i < pendingFiles.length; i++) {
        const p = pendingFiles[i]
        const up = await uploadImageWithMeta(p.file, folder, `img-${Date.now()}-${i + 1}`)
        uploaded.push(up)
      }

      const newImages = [...formData.images, ...uploaded]

      const res = await fetch(`/api/dashboard/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          price: Number.parseFloat(formData.price),
          stock: Number.parseInt(formData.stock),
          category_id: formData.category_id || null,
          images: newImages,
          colors: Array.isArray(formData.attributes?.colors) ? formData.attributes.colors : undefined,
          sizes: Array.isArray(formData.attributes?.sizes) ? formData.attributes.sizes : undefined,
          weight: typeof formData.attributes?.weight === 'string' ? formData.attributes.weight : undefined,
          attributes: {
            ...formData.attributes,
            price_unit: formData.price_unit,
            stock_unit: formData.stock_unit,
          },
          status: formData.status,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Failed to update product (${res.status}): ${errText}`)
      }

      setPendingFiles([])
      toastHelpers.productUpdated(formData.title)
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error updating product:", error)
      toastHelpers.saveError("Failed to update product. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!vendor || !product) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button asChild>
            <Link href="/dashboard/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update your product information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Premium Wireless Headphones" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="flex-1 h-11" />
                    <Select value={formData.price_unit} onValueChange={(value: string) => setFormData({ ...formData, price_unit: value })}>
                      <SelectTrigger className="w-full sm:w-24 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">per unit</SelectItem>
                        <SelectItem value="yard">per yard</SelectItem>
                        <SelectItem value="meter">per meter</SelectItem>
                        <SelectItem value="kg">per kg</SelectItem>
                        <SelectItem value="lb">per lb</SelectItem>
                        <SelectItem value="piece">per piece</SelectItem>
                        <SelectItem value="set">per set</SelectItem>
                        <SelectItem value="dozen">per dozen</SelectItem>
                        <SelectItem value="box">per box</SelectItem>
                        <SelectItem value="pack">per pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="flex-1 h-11" />
                    <Select value={formData.stock_unit} onValueChange={(value: string) => setFormData({ ...formData, stock_unit: value })}>
                      <SelectTrigger className="w-full sm:w-24 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">units</SelectItem>
                        <SelectItem value="yard">yards</SelectItem>
                        <SelectItem value="meter">meters</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lbs</SelectItem>
                        <SelectItem value="piece">pieces</SelectItem>
                        <SelectItem value="set">sets</SelectItem>
                        <SelectItem value="dozen">dozens</SelectItem>
                        <SelectItem value="box">boxes</SelectItem>
                        <SelectItem value="pack">packs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={formData.category_id} onValueChange={(value: string) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setAddingCategory((s) => !s)}>
                    {addingCategory ? 'Cancel' : '+ Add Category'}
                  </Button>
                </div>
                {addingCategory && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          (document.getElementById('btn-create-category-edit') as HTMLButtonElement)?.click();
                        }
                      }}
                    />
                    <Button
                      id="btn-create-category-edit"
                      disabled={catSaving || !newCategoryName.trim()}
                      onClick={async () => {
                        const name = newCategoryName.trim();
                        if (!name) return;
                        setCatSaving(true);
                        try {
                          const res = await fetch('/api/dashboard/categories', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
                          })
                          if (!res.ok) throw new Error('Create failed')
                          const { category } = await res.json()
                          setCategories((prev) => [category, ...prev])
                          setFormData((prev) => ({ ...prev, category_id: category.id }))
                          setNewCategoryName("")
                          setAddingCategory(false)
                          toastHelpers.success('Category created', name)
                        } catch (e) {
                          toastHelpers.saveError('Failed to create category')
                        } finally {
                          setCatSaving(false)
                        }
                      }}
                    >
                      {catSaving ? 'Creating…' : 'Create'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-600" />
                Product Images
              </CardTitle>
              <CardDescription>Upload high-quality images to showcase your product</CardDescription>
            </CardHeader>
            <CardContent>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square relative rounded overflow-hidden">
                        <img src={(typeof img === 'string' ? img : (img as any)?.url) || "/placeholder.svg"} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageByIndex(idx)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <Badge variant="destructive" className="cursor-pointer select-none">Remove</Badge>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <CloudinaryUploadDeferred onSelect={onSelectPending} onRemove={onRemovePending} pending={pendingFiles} maxFiles={Math.max(0, 5 - formData.images.length)} label="Select Product Images" description="Preview now; images upload when you save." className="w-full" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
              <CardDescription>Variants & custom attributes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variants & Attributes */}
              <div className="p-4 rounded-lg border bg-slate-50">
                <h4 className="font-medium mb-3">Variants & Attributes</h4>
                {/* Colors */}
                <div className="mb-4">
                  <Label className="text-sm mb-2 block">Color Options</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Array.isArray(formData.attributes.colors) ? formData.attributes.colors : []).map((c: string) => (
                      <Badge key={c} className="gap-1" style={{ backgroundColor: c, color: getContrastingTextColor(c), borderColor: 'transparent' }}>
                        {c}
                        <button type="button" className="opacity-80 hover:opacity-100" onClick={() => removeColor(c)}>×</button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="e.g., Pink" onKeyDown={(e) => { if (e.key==='Enter'){ e.preventDefault(); const input=e.target as HTMLInputElement; addColor(input.value); input.value='' } }} />
                    <Button type="button" variant="outline" onClick={(e) => { const i=(e.currentTarget.parentElement?.querySelector('input')) as HTMLInputElement|null; if(i){ addColor(i.value); i.value='' } }}>Add Color</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div className="mb-4">
                  <Label className="text-sm mb-2 block">Size Options</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['XS','S','M','L','XL','XXL'].map((s) => {
                      const active = Array.isArray(formData.attributes.sizes) && formData.attributes.sizes.includes(s)
                      return (
                        <Button key={s} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleSize(s)}>{s}</Button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Custom sizes (comma separated)" onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); const vals=(e.target as HTMLInputElement).value.split(',').map(v=>v.trim()).filter(Boolean); vals.forEach(v=>toggleSize(v)); (e.target as HTMLInputElement).value='' } }} />
                  </div>
                </div>

                {/* Weight */}
                <div className="mb-2">
                  <Label className="text-sm mb-2 block">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 1.2"
                      className="w-28"
                      value={weightVal}
                      onChange={(e) => { setWeightVal(e.target.value); setWeight(e.target.value, weightUnit) }}
                    />
                    <select
                      id="edit-weight-unit"
                      className="border rounded px-2"
                      value={weightUnit}
                      onChange={(e) => { const u = e.target.value as "kg"|"g"|"lb"; setWeightUnit(u); setWeight(weightVal, u) }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Saved as a simple string (e.g., "1.2 kg").</p>
                </div>
              </div>

              {/* Custom attributes editor */}
              <AttributeEditor attributes={formData.attributes} excludeKeys={["price_unit","stock_unit"]} onChange={(next) => setFormData({ ...formData, attributes: next })} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.status} onValueChange={(value: "active" | "inactive" | "draft") => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleSave} disabled={saving || !formData.title || !formData.price || !formData.stock || (formData.images.length + pendingFiles.length < 1)} className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Update Product"}
              </Button>
              <Button variant="outline" asChild className="w-full h-11 bg-transparent hover:bg-slate-50 text-slate-700">
                <Link href="/dashboard/products">Cancel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
