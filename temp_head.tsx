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
import { ArrowLeft, Save, Image } from "lucide-react"
import Link from "next/link"
import CloudinaryUploadDeferred, { type PendingFile } from "@/components/ui/cloudinary-upload-deferred"
import { uploadImageWithMeta, deleteImage as deleteCloudinaryImage } from "@/lib/cloudinary"
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
    images: [] as (string | { url: string; public_id?: string })[],
    attributes: {} as Record<string, any>,
    status: "active" as "active" | "inactive" | "draft",
  })

  useEffect(() => {
    async function fetchData() {
      // Ensure session exists (client-side); fall back to API 401 handling
      const { data: session } = await authClient.getSession()
      if (!session?.user) {
        router.push("/auth/login")
        return
      }

      // Fetch vendor owned by current user
      const vendorRes = await fetch('/api/dashboard/vendor', { cache: 'no-store' })
      if (vendorRes.status === 401) {
        router.push("/auth/login")
        return
      }
      const { vendor: vendorData } = await vendorRes.json()
      if (!vendorData) {
        // No vendor yet; send to onboarding or login fallback
        router.push("/onboarding")
        return
      }
      setVendor(vendorData)

      // Fetch the product to edit (ensures ownership on server)
      const productRes = await fetch(`/api/dashboard/products/${productId}`, { cache: 'no-store' })
      if (!productRes.ok) {
        router.push("/dashboard/products")
        return
      }
      const { product: productData } = await productRes.json()
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

      // Fetch categories for this vendor
      const catsRes = await fetch('/api/dashboard/categories', { cache: 'no-store' })
      if (catsRes.ok) {
        const { categories: categoriesData } = await catsRes.json()
        setCategories(categoriesData || [])
      }
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

  const removeImageByIndex = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    })
  }

  const onSelectPending = (files: PendingFile[]) => {
    setPendingFiles((prev) => [...prev, ...files])
  }

  const onRemovePending = (previewUrl: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.previewUrl !== previewUrl))
    try { URL.revokeObjectURL(previewUrl) } catch {}
  }

  const removeExistingImage = async (img: string | { url: string; public_id?: string }, index: number) => {
    try {
      // Prefer public_id if available; fallback to URL extraction in helper
      const id = typeof img === 'string' ? img : (img.public_id || img.url)
      await deleteCloudinaryImage(id)
    } catch {}
    removeImageByIndex(index)
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
          images: [...formData.images, ...uploaded],
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
