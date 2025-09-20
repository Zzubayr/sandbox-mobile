"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, X, Image } from "lucide-react"
import Link from "next/link"
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor, Category } from "@/lib/types"

export default function NewProductPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
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
    attributes: {} as Record<string, string>,
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

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("vendor_id", vendorData.id)
        .order("name")

      setVendor(vendorData)
      setCategories(categoriesData || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  const addAttribute = () => {
    if (newAttribute.key && newAttribute.value) {
      const key = newAttribute.key.toLowerCase().replace(/\s+/g, '_')
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [key]: newAttribute.value,
        },
      })
      
      // Add to attribute values for future use
      if (!attributeValues[key]) {
        setAttributeValues({
          ...attributeValues,
          [key]: [newAttribute.value]
        })
      } else if (!attributeValues[key].includes(newAttribute.value)) {
        setAttributeValues({
          ...attributeValues,
          [key]: [...attributeValues[key], newAttribute.value]
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
    if (!vendor) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("products").insert({
        vendor_id: vendor.id,
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
      })

      if (error) throw error

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product for your store</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
              <CardDescription>Add specifications and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new attribute */}
              <div className="flex gap-2">
                <Input
                  placeholder="Attribute name (e.g., Material)"
                  value={newAttribute.key}
                  onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
                />
                <Input
                  placeholder="Value (e.g., Faux Leather)"
                  value={newAttribute.value}
                  onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                />
                <Button onClick={addAttribute} disabled={!newAttribute.key || !newAttribute.value}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Existing attributes */}
              {Object.keys(formData.attributes).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-slate-700">Current Attributes</h4>
                  {Object.entries(formData.attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-slate-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          value={value}
                          onChange={(e) => {
                            const newAttributes = { ...formData.attributes }
                            newAttributes[key] = e.target.value
                            setFormData({ ...formData, attributes: newAttributes })
                          }}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAttribute(key)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested attributes based on existing keys */}
              {Object.keys(attributeValues).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-slate-700">Quick Add from Previous Products</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(attributeValues).map(([key, values]) => (
                      <div key={key} className="p-2 border rounded-lg">
                        <Label className="text-xs font-medium text-slate-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {values.slice(0, 3).map((value) => (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => {
                                const newAttributes = { ...formData.attributes }
                                newAttributes[key] = value
                                setFormData({ ...formData, attributes: newAttributes })
                              }}
                            >
                              {value}
                            </Button>
                          ))}
                          {values.length > 3 && (
                            <span className="text-xs text-slate-500">+{values.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                disabled={saving || !formData.title || !formData.price || !formData.stock}
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
