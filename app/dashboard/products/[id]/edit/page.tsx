"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Image } from "lucide-react"
import Link from "next/link"
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload"
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
  const [newAttribute, setNewAttribute] = useState({ key: "", value: "" })
  const [attributeValues, setAttributeValues] = useState({} as Record<string, string[]>)
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

  useEffect(() => {
    async function fetchData() {
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

      // Fetch the product to edit
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          category:categories (name)
        `)
        .eq("id", productId)
        .eq("vendor_id", vendorData.id)
        .single()

      if (productError || !productData) {
        console.error("Error fetching product:", productError)
        router.push("/dashboard/products")
        return
      }

      setProduct(productData)

      // Set form data from existing product
      setFormData({
        title: productData.title,
        description: productData.description || "",
        price: productData.price.toString(),
        stock: productData.stock.toString(),
        price_unit: productData.attributes?.price_unit || "unit",
        stock_unit: productData.attributes?.stock_unit || "unit",
        category_id: productData.category_id || "",
        images: productData.images || [],
        attributes: productData.attributes || {},
        status: productData.status,
      })

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("vendor_id", vendorData.id)
        .order("name")

      setCategories(categoriesData || [])
      setLoading(false)
    }

    fetchData()
  }, [router, productId])

  const addAttribute = () => {
    if (newAttribute.key && newAttribute.value) {
      const key = newAttribute.key.toLowerCase().replace(/\s+/g, '_')
      // Parse comma-separated values
      const values = newAttribute.value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)

      const existing = formData.attributes[key]
      let merged: string[]
      if (Array.isArray(existing)) {
        const set = new Set<string>([...existing, ...values])
        merged = Array.from(set)
      } else if (typeof existing === 'string' && existing) {
        const set = new Set<string>([existing, ...values])
        merged = Array.from(set)
      } else {
        merged = values
      }

      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [key]: merged,
        },
      })

      // Add to attribute values for future use
      if (!attributeValues[key]) {
        setAttributeValues({
          ...attributeValues,
          [key]: merged,
        })
      } else {
        const set = new Set<string>([...attributeValues[key], ...values])
        setAttributeValues({
          ...attributeValues,
          [key]: Array.from(set),
        })
      }

      setNewAttribute({ key: "", value: "" })
    }
  }

  const removeAttribute = (key: string) => {
    const newAttributes = { ...formData.attributes }
    delete newAttributes[key]
    setFormData({ ...formData, attributes: newAttributes })
  }

  const addImage = (url: string) => {
    setFormData({
      ...formData,
      images: [...formData.images, url],
    })
  }

  const removeImage = (url: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((imageUrl) => imageUrl !== url),
    })
  }

  const handleSave = async () => {
    if (!vendor || !product) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("products")
        .update({
          title: formData.title,
          description: formData.description || null,
          price: Number.parseFloat(formData.price),
          stock: Number.parseInt(formData.stock),
          category_id: formData.category_id || null,
          images: formData.images,
          attributes: {
            ...formData.attributes,
            price_unit: formData.price_unit,
            stock_unit: formData.stock_unit,
          },
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("vendor_id", vendor.id)

      if (error) throw error

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
              <CloudinaryUpload
                onUpload={addImage}
                onRemove={removeImage}
                existingImages={formData.images}
                maxImages={5}
                folder="sandbox/products"
                label="Upload Product Images"
                description="Upload high-quality images (JPG, PNG, WebP, GIF). Max 5MB per image. First image will be the main product photo."
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
              <CardDescription>Add specifications and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card className="border-0 shadow-lg">
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

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving || !formData.title || !formData.price || !formData.stock}
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
