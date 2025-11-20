"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Image } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getContrastingTextColor } from "@/lib/color-utils"
import CloudinaryUploadDeferred, { type PendingFile } from "@/components/ui/cloudinary-upload-deferred"
import { uploadImageWithMeta } from "@/lib/cloudinary"
import { AttributeEditor } from "@/components/dashboard/attribute-editor"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Category } from "@/lib/types"

export default function NewProductPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [catSaving, setCatSaving] = useState(false)
  // attributes are edited via AttributeEditor and stored as arrays
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    price_unit: "unit",
    stock_unit: "unit",
    category_id: "",
    images: [] as string[],
    attributes: {} as Record<string, any>,
    status: "active" as "active" | "inactive" | "draft",
  })

  // Local helpers for variants/attributes UX
  const addColor = (name: string) => {
    const val = name.trim()
    if (!val) return
    const current: string[] = Array.isArray(formData.attributes.colors) ? formData.attributes.colors : []
    if (current.includes(val)) return
    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, colors: [...current, val] },
    }))
  }
  const removeColor = (name: string) => {
    const current: string[] = Array.isArray(formData.attributes.colors) ? formData.attributes.colors : []
    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, colors: current.filter((c) => c !== name) },
    }))
  }
  const toggleSize = (size: string) => {
    const current: string[] = Array.isArray(formData.attributes.sizes) ? formData.attributes.sizes : []
    const set = new Set(current)
    if (set.has(size)) set.delete(size)
    else set.add(size)
    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, sizes: Array.from(set) },
    }))
  }
  const setWeight = (value: string, unit: string) => {
    const val = value.trim()
    const final = val ? `${val} ${unit}` : ""
    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, weight: final },
    }))
  }

  useEffect(() => {
    async function fetchData() {
      const vendRes = await fetch('/api/dashboard/me/vendor', { cache: 'no-store' })
      if (!vendRes.ok) {
        router.push('/auth/login')
        return
      }
      const vendJson = await vendRes.json()
      if (!vendJson.vendor) {
        router.push('/onboarding')
        return
      }
      setVendor(vendJson.vendor)
      const catRes = await fetch('/api/dashboard/categories', { cache: 'no-store' })
      const catJson = catRes.ok ? await catRes.json() : { categories: [] }
      setCategories(catJson.categories || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  // attribute add/remove handled by AttributeEditor

  const onSelectPending = (files: PendingFile[]) => {
    setPendingFiles((prev) => [...prev, ...files])
  }

  const onRemovePending = (previewUrl: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.previewUrl !== previewUrl))
    try { URL.revokeObjectURL(previewUrl) } catch {}
  }

  const handleSave = async () => {
    if (!vendor) return

    setSaving(true)
    try {
      if (pendingFiles.length < 1) {
        toastHelpers.saveError('Please add at least one product image before saving.')
        setSaving(false)
        return
      }
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        category_id: formData.category_id || undefined,
        images: [],
        colors: Array.isArray(formData.attributes.colors) ? formData.attributes.colors : undefined,
        sizes: Array.isArray(formData.attributes.sizes) ? formData.attributes.sizes : undefined,
        weight: typeof formData.attributes.weight === 'string' ? formData.attributes.weight : undefined,
        attributes: {
          ...formData.attributes,
          price_unit: formData.price_unit,
          stock_unit: formData.stock_unit,
        },
        status: formData.status,
      }
      const res = await fetch('/api/dashboard/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Create failed (${res.status}): ${errText}`)
      }
      const { product } = await res.json()
      if (!product?.id) {
        throw new Error('Product was created without an id; aborting uploads')
      }

      // Upload pending files to vendors/{vendorId}/products/{productId}
      const folder = `vendors/${vendor.id}/products/${product.id}`
      const uploaded = [] as { url: string; public_id: string }[]
      try {
        for (let i = 0; i < pendingFiles.length; i++) {
          const p = pendingFiles[i]
          const up = await uploadImageWithMeta(p.file, folder, `img-${i + 1}`)
          uploaded.push(up)
        }

        const patchRes = await fetch(`/api/dashboard/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: uploaded }),
          credentials: 'same-origin',
        })
        if (!patchRes.ok) {
          const errText = await patchRes.text().catch(() => '')
          throw new Error(`Failed to save uploaded images (${patchRes.status}): ${errText}`)
        }
      } catch (uploadErr) {
        // Roll back the presaved product
        try { await fetch(`/api/dashboard/products/${product.id}`, { method: 'DELETE' }) } catch {}
        const msg = uploadErr instanceof Error ? uploadErr.message : 'Image upload failed'
        toastHelpers.uploadError(msg)
        throw uploadErr
      }

      // Verify product now has images before navigating
      try {
        const verify = await fetch(`/api/dashboard/products/${product.id}`, { cache: 'no-store' })
        if (verify.ok) {
          const { product: verified } = await verify.json()
          if (!verified?.images || verified.images.length === 0) {
            console.warn('Images missing on verify step; showing placeholder until next refresh')
          }
        }
      } catch {}

      setPendingFiles([])
      toastHelpers.productCreated(formData.title)
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error creating product:", error)
      toastHelpers.saveError("Failed to create product. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  if (!vendor) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" asChild className="self-start">
          <Link href="/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Create a new product for your store</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Premium Wireless Headphones"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Experience immersive sound with our new premium wireless headphones..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="99.99"
                      className="flex-1 h-11"
                    />
                    <Select
                      value={formData.price_unit}
                      onValueChange={(value) => setFormData({ ...formData, price_unit: value })}
                    >
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
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="150"
                      className="flex-1 h-11"
                    />
                    <Select
                      value={formData.stock_unit}
                      onValueChange={(value) => setFormData({ ...formData, stock_unit: value })}
                    >
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setAddingCategory((s) => !s)} className="w-full sm:w-auto">
                    {addingCategory ? 'Cancel' : '+ Add Category'}
                  </Button>
                </div>
                {addingCategory && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          (document.getElementById('btn-create-category-new') as HTMLButtonElement)?.click();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      id="btn-create-category-new"
                      disabled={catSaving || !newCategoryName.trim()}
                      onClick={async () => {
                        const name = newCategoryName.trim();
                        if (!name) return;
                        setCatSaving(true);
                        try {
                          const res = await fetch('/api/dashboard/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name }),
                          })
                          if (!res.ok) throw new Error('Create category failed')
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
                      className="w-full sm:w-auto"
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
                    <Image className="w-5 h-5 text-green-600" />
                    Product Images
                  </CardTitle>
                  <CardDescription>Upload high-quality images to showcase your product</CardDescription>
                </CardHeader>
                <CardContent>
                  <CloudinaryUploadDeferred
                    onSelect={onSelectPending}
                    onRemove={onRemovePending}
                    pending={pendingFiles}
                    maxFiles={5}
                    label="Select Product Images"
                    description="Preview immediately. Images will upload when you save."
                    className="w-full"
                  />
                </CardContent>
              </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
              <CardDescription>Add specifications and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variants & Attributes quick UI */}
              <div className="p-4 rounded-lg border bg-slate-50">
                <h4 className="font-medium mb-3">Variants & Attributes</h4>
                {/* Colors */}
                <div className="mb-4">
                  <Label className="text-sm mb-2 block">Color Options</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Array.isArray(formData.attributes.colors) ? formData.attributes.colors : []).map((c: string) => (
                      <Badge key={c} className="gap-1" style={{ backgroundColor: c, color: getContrastingTextColor(c), borderColor: "transparent" }}>{c}<button type="button" className="opacity-80 hover:opacity-100" onClick={() => removeColor(c)}>
                          ×
                        </button></Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input placeholder="e.g., Red" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' } }} className="flex-1" />
                    <Button type="button" variant="outline" onClick={(e) => { const input = (e.currentTarget.parentElement?.querySelector('input')) as HTMLInputElement | null; if (input) { addColor(input.value); input.value = '' } }} className="w-full sm:w-auto">Add Color</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div className="mb-4">
                  <Label className="text-sm mb-2 block">Size Options</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['XS','S','M','L','XL','XXL'].map((s) => {
                      const active = Array.isArray(formData.attributes.sizes) && formData.attributes.sizes.includes(s)
                      return (
                        <Button key={s} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleSize(s)}>
                          {s}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Custom sizes (comma separated)" onKeyDown={(e) => { if (e.key==='Enter'){ e.preventDefault(); const vals = (e.target as HTMLInputElement).value.split(',').map(v=>v.trim()).filter(Boolean); vals.forEach(v=>toggleSize(v)); (e.target as HTMLInputElement).value='' } }} className="w-full" />
                  </div>
                </div>

                {/* Weight */}
                <div className="mb-2">
                  <Label className="text-sm mb-2 block">Weight</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input placeholder="e.g., 1.2" className="flex-1 sm:w-28" onChange={(e) => setWeight(e.target.value, (document.getElementById('weight-unit') as HTMLSelectElement)?.value || 'kg')} />
                    <select id="weight-unit" className="border rounded px-2 w-full sm:w-auto" onChange={(e) => setWeight(((document.querySelector('#weight-unit') as HTMLSelectElement) && (document.querySelector<HTMLInputElement>('input[placeholder="e.g., 1.2"]')?.value || ''))!, e.target.value)}>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Saved as a simple string (e.g., "1.2 kg").</p>
                </div>
              </div>

              <AttributeEditor
                attributes={formData.attributes}
                excludeKeys={["price_unit","stock_unit"]}
                onChange={(next) => setFormData({ ...formData, attributes: next })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
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

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving || !formData.title || !formData.price || !formData.stock || pendingFiles.length < 1}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Product"}
              </Button>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/dashboard/products">Cancel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}








