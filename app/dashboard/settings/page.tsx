"use client"

import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/lib/theme-context"
import { Save, Copy, ExternalLink, Palette, Store, Phone, Check, Image as ImageIcon, Share2, Facebook, Instagram, Twitter, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import CloudinaryUploadDeferred, { type PendingFile } from "@/components/ui/cloudinary-upload-deferred"
import { uploadImageWithMeta, deleteImage as deleteCloudinaryImage, extractPublicId } from "@/lib/cloudinary"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { getCategoryMap } from "@/lib/onboarding-categories"

export default function SettingsPage() {
  const { setTheme } = useTheme()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingLogo, setPendingLogo] = useState<PendingFile[]>([])
  const [pendingBanner, setPendingBanner] = useState<PendingFile[]>([])
  const [prevLogoId, setPrevLogoId] = useState<string | null>(null)
  const [prevBannerId, setPrevBannerId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    store_name: "",
    description: "",
    whatsapp_number: "",
    theme_color: "blue" as "blue" | "green" | "purple",
    logo_url: "",
    banner_url: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    whatsapp: "",
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

  useEffect(() => {
    async function fetchVendor() {
      const res = await fetch('/api/dashboard/vendor', { cache: 'no-store' })
      if (!res.ok) {
        redirect('/auth/login')
        return
      }
      const json = await res.json()
      const vendorData = json.vendor
      if (!vendorData) {
        redirect('/onboarding')
        return
      }
      setVendor(vendorData)
      setFormData({
        store_name: vendorData.store_name,
        description: vendorData.description || "",
        whatsapp_number: vendorData.whatsapp_number || "",
        theme_color: vendorData.theme_color,
        logo_url: vendorData.logo_url || "",
        banner_url: vendorData.banner_url || "",
        facebook: vendorData.facebook || "",
        instagram: vendorData.instagram || "",
        twitter: vendorData.twitter || "",
        linkedin: vendorData.linkedin || "",
        whatsapp: vendorData.whatsapp || "",
      })
      setSelectedCategories(Array.isArray(vendorData.business_categories) ? vendorData.business_categories : [])
      setSelectedSubcategories(Array.isArray(vendorData.business_subcategories) ? vendorData.business_subcategories : [])
      // Track previous Cloudinary public IDs for cleanup on save
      setPrevLogoId(vendorData.logo?.public_id || extractPublicId(vendorData.logo_url || ""))
      setPrevBannerId(vendorData.banner?.public_id || extractPublicId(vendorData.banner_url || ""))
      setLoading(false)
    }

    fetchVendor()
  }, [])

  const handleSave = async () => {
    if (!vendor) return

    setSaving(true)
    try {
      // Upload pending branding assets first
      const updates: any = {}
      const baseFolder = `vendors/${vendor.id}/branding`

      if (pendingLogo.length > 0) {
        const uniqueId = `logo-${Date.now()}`
        const up = await uploadImageWithMeta(pendingLogo[0].file, `${baseFolder}/logo`, uniqueId)
        updates.logo_url = up.url
        updates.logo = up
      }
      if (pendingBanner.length > 0) {
        const uniqueId = `banner-${Date.now()}`
        const up = await uploadImageWithMeta(pendingBanner[0].file, `${baseFolder}/banner`, uniqueId)
        updates.banner_url = up.url
        updates.banner = up
      }

      const res = await fetch('/api/dashboard/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: formData.store_name,
          description: formData.description || undefined,
          whatsapp_number: formData.whatsapp_number || undefined,
          theme_color: formData.theme_color,
          logo_url: updates.logo_url ?? (formData.logo_url || undefined),
          banner_url: updates.banner_url ?? (formData.banner_url || undefined),
          logo: updates.logo,
          banner: updates.banner,
          business_categories: selectedCategories,
          business_subcategories: selectedSubcategories,
          facebook: formData.facebook || undefined,
          instagram: formData.instagram || undefined,
          twitter: formData.twitter || undefined,
          linkedin: formData.linkedin || undefined,
          whatsapp: formData.whatsapp || undefined,
        })
      })
      if (!res.ok) throw new Error('Failed to save')
      const { vendor: savedVendor } = await res.json().catch(() => ({ vendor: null }))

      // Prefer authoritative server response to avoid local drift/caches
      if (savedVendor) {
        setVendor(savedVendor)
        setFormData({
          store_name: savedVendor.store_name,
          description: savedVendor.description || "",
          whatsapp_number: savedVendor.whatsapp_number || "",
          theme_color: savedVendor.theme_color,
          logo_url: savedVendor.logo_url || "",
          banner_url: savedVendor.banner_url || "",
          facebook: savedVendor.facebook || "",
          instagram: savedVendor.instagram || "",
          twitter: savedVendor.twitter || "",
          linkedin: savedVendor.linkedin || "",
          whatsapp: savedVendor.whatsapp || "",
        })
      } else {
        const nextVendor = { ...vendor, ...formData, ...updates }
        setVendor(nextVendor as any)
        setFormData((prev) => ({
          ...prev,
          logo_url: updates.logo_url ?? prev.logo_url,
          banner_url: updates.banner_url ?? prev.banner_url,
        }))
      }
      setPendingLogo([])
      setPendingBanner([])
      // Apply theme immediately
      setTheme(formData.theme_color)
      toastHelpers.settingsSaved()

      // After successful save, clean up previous Cloudinary assets if replaced or removed
      try {
        const newLogoId = savedVendor?.logo?.public_id ?? updates.logo?.public_id ?? null
        const newBannerId = savedVendor?.banner?.public_id ?? updates.banner?.public_id ?? null
        if (prevLogoId && prevLogoId !== newLogoId) {
          await deleteCloudinaryImage(prevLogoId)
          setPrevLogoId(newLogoId)
        }
        if (prevBannerId && prevBannerId !== newBannerId) {
          await deleteCloudinaryImage(prevBannerId)
          setPrevBannerId(newBannerId)
        }
      } catch (e) {
        console.warn('Branding cleanup warning:', e)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toastHelpers.saveError("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const copyStoreLink = async () => {
    if (!vendor) return
    const storeUrl = `${window.location.origin}/store/${vendor.store_slug}`
    try {
      await navigator.clipboard.writeText(storeUrl)
      toastHelpers.storeLinkCopied()
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = storeUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toastHelpers.storeLinkCopied()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  if (!vendor) {
    return null
  }

  const storeUrl = `${window.location.origin}/store/${vendor.store_slug}`
  const selectedColors = getThemeColors(formData.theme_color)
  const categoryMap = getCategoryMap((vendor?.business_type as ('products'|'services')) || 'products')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your store appearance and information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyStoreLink} className="flex-1 md:flex-none">
            <Copy className="mr-2 h-4 w-4" />
            Copy Store Link
          </Button>
          <Button variant="outline" asChild className="flex-1 md:flex-none">
            <Link href={storeUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview Store
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Store className="w-5 h-5" style={{ color: selectedColors.primary }} />
                Basic Information
              </CardTitle>
              <CardDescription>Update your store's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="store_name" className="text-sm font-medium">Store Name</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="My Awesome Store"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell customers what makes your store special..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="+1234567890"
                  className="h-11"
                />
                <p className="text-xs text-slate-600">
                  Include country code (e.g., +1 for US). Customers will use this to contact you.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="w-5 h-5" style={{ color: selectedColors.primary }} />
                Theme & Branding
              </CardTitle>
              <CardDescription>Customize your store's appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme Color
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {([
                    { value: "blue", label: "Ocean Blue", description: "Professional and trustworthy" },
                    { value: "green", label: "Forest Green", description: "Natural and growth-focused" },
                    { value: "purple", label: "Royal Purple", description: "Creative and premium" }
                  ] as const).map((theme) => {
                    const colors = getThemeColors(theme.value)
                    return (
                      <button
                        key={theme.value}
                        onClick={() => {
                          setFormData({ ...formData, theme_color: theme.value })
                          setTheme(theme.value)
                        }}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          formData.theme_color === theme.value 
                            ? "shadow-md" 
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                        style={formData.theme_color === theme.value ? {
                          borderColor: colors.primary,
                          background: `linear-gradient(to bottom right, ${colors.light}, white)`
                        } : {}}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex gap-1">
                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: colors.primary }} />
                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: colors.secondary }} />
                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: colors.accent }} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-slate-800">{theme.label}</p>
                            <p className="text-sm text-slate-600">{theme.description}</p>
                          </div>
                          {formData.theme_color === theme.value && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <Badge className="text-white" style={{ backgroundColor: colors.primary }}>
                                Active
                              </Badge>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    Store Logo
                  </Label>
                  {(formData.logo_url || pendingLogo.length > 0) ? (
                    <div className="space-y-3">
                      <div className="w-24 h-24 relative border-2 border-slate-200 rounded-lg overflow-hidden">
                        <Image
                          src={(pendingLogo[0]?.previewUrl || formData.logo_url) as string}
                          alt="Store Logo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPendingLogo([]); setFormData({ ...formData, logo_url: "" }) }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <CloudinaryUploadDeferred
                      onSelect={(files) => setPendingLogo(files.slice(0,1))}
                      onRemove={(preview) => setPendingLogo((prev) => prev.filter((p) => p.previewUrl !== preview))}
                      pending={pendingLogo}
                      maxFiles={1}
                      label="Select Store Logo"
                      description="Preview now; uploads on save."
                      className="w-full"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    Store Banner
                  </Label>
                  {(formData.banner_url || pendingBanner.length > 0) ? (
                    <div className="space-y-3">
                      <div className="w-full h-32 relative border-2 border-slate-200 rounded-lg overflow-hidden">
                        <Image
                          src={(pendingBanner[0]?.previewUrl || formData.banner_url) as string}
                          alt="Store Banner"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPendingBanner([]); setFormData({ ...formData, banner_url: "" }) }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Banner
                      </Button>
                    </div>
                  ) : (
                    <CloudinaryUploadDeferred
                      onSelect={(files) => setPendingBanner(files.slice(0,1))}
                      onRemove={(preview) => setPendingBanner((prev) => prev.filter((p) => p.previewUrl !== preview))}
                      pending={pendingBanner}
                      maxFiles={1}
                      label="Select Store Banner"
                      description="Preview now; uploads on save."
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Share2 className="w-5 h-5" style={{ color: selectedColors.primary }} />
                Social Media Links
              </CardTitle>
              <CardDescription>Connect your social media profiles to display on your storefront</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="facebook" className="text-sm font-medium flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  placeholder="https://facebook.com/yourpage"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  placeholder="https://instagram.com/yourprofile"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="twitter" className="text-sm font-medium flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  placeholder="https://twitter.com/yourhandle"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="whatsapp" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  WhatsApp Link
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="https://wa.me/1234567890"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Use format: https://wa.me/your-phone-number (with country code, no spaces)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                Business Categories
              </CardTitle>
              <CardDescription>Select categories and subcategories that fit your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.keys(categoryMap).map((cat) => {
                    const active = selectedCategories.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategories((prev) => active ? prev.filter(c => c !== cat) : [...prev, cat])}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${active ? 'text-white shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                        style={active ? { backgroundColor: selectedColors.primary, borderColor: selectedColors.primary } : {}}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedCategories.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Subcategories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.flatMap((cat) => categoryMap[cat] || []).map((sub) => {
                      const active = selectedSubcategories.includes(sub)
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSelectedSubcategories((prev) => active ? prev.filter(s => s !== sub) : [...prev, sub])}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${active ? '' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                          style={active ? { 
                            backgroundColor: selectedColors.light, 
                            color: selectedColors.dark,
                            borderColor: selectedColors.accent 
                          } : {}}
                        >
                          {sub}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full h-12 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ 
              background: `linear-gradient(to right, ${selectedColors.primary}, ${selectedColors.dark})`,
            }}
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Live Preview */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-0 shadow-md sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Live Preview</CardTitle>
              <CardDescription>See how your store will look to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Preview Header */}
                <div className="border-b bg-background/95 p-4">
                  <div className="flex items-center gap-3">
                    {(formData.logo_url || pendingLogo.length > 0) ? (
                      <img
                        src={(pendingLogo[0]?.previewUrl || formData.logo_url || "/placeholder.svg") as string}
                        alt={formData.store_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: selectedColors.primary }}
                      >
                        {formData.store_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold" style={{ color: selectedColors.primary }}>
                        {formData.store_name || "Store Name"}
                      </h3>
                      {formData.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{formData.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Banner */}
                {(formData.banner_url || pendingBanner.length > 0) && (
                  <div className="h-32 relative bg-gray-100">
                    <img
                      src={(pendingBanner[0]?.previewUrl || formData.banner_url || "/placeholder.svg") as string}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-center text-white">
                        <h2 className="text-lg font-bold">{formData.store_name}</h2>
                        {formData.description && <p className="text-sm opacity-90">{formData.description}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Content */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Products</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="border rounded-lg overflow-hidden">
                          <div className="aspect-square bg-gray-100"></div>
                          <div className="p-2">
                            <p className="text-sm font-medium">Sample Product {i}</p>
                            <p className="text-sm" style={{ color: selectedColors.primary }}>
                              $99.99
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store URL:</span>
                <span className="text-sm font-mono">/store/{vendor.store_slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theme:</span>
                <Badge variant="outline" style={{ borderColor: selectedColors.primary }}>
                  {formData.theme_color}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="text-sm">
                  {formData.whatsapp_number ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not set</Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
