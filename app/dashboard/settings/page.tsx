"use client"

import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/lib/theme-context"
import { Save, Copy, ExternalLink, Palette, Store, Phone, Check, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"

export default function SettingsPage() {
  const { setTheme } = useTheme()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    store_name: "",
    description: "",
    whatsapp_number: "",
    theme_color: "blue" as "blue" | "green" | "purple",
    logo_url: "",
    banner_url: "",
  })

  useEffect(() => {
    async function fetchVendor() {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        redirect("/auth/login")
        return
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (vendorError || !vendorData) {
        redirect("/auth/login")
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
      })
      setLoading(false)
    }

    fetchVendor()
  }, [])

  const handleSave = async () => {
    if (!vendor) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          store_name: formData.store_name,
          description: formData.description || null,
          whatsapp_number: formData.whatsapp_number || null,
          theme_color: formData.theme_color,
          logo_url: formData.logo_url || null,
          banner_url: formData.banner_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendor.id)

      if (error) throw error

      // Update local state
      setVendor({ ...vendor, ...formData })
      // Apply theme immediately
      setTheme(formData.theme_color)
      toastHelpers.settingsSaved()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground">Customize your store appearance and information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyStoreLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Store Link
          </Button>
          <Button variant="outline" asChild>
            <Link href={storeUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview Store
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
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

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
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
                        className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                          formData.theme_color === theme.value 
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg" 
                            : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md"
                        }`}
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
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <Badge className="bg-blue-500 text-white">
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
                  {formData.logo_url ? (
                    <div className="space-y-3">
                      <div className="w-24 h-24 relative border-2 border-slate-200 rounded-lg overflow-hidden">
                        <Image
                          src={formData.logo_url}
                          alt="Store Logo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, logo_url: "" })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <CloudinaryUpload
                      onUpload={(url) => setFormData({ ...formData, logo_url: url })}
                      maxImages={1}
                      folder="sandbox/logos"
                      label="Upload Store Logo"
                      description="Upload your store logo (JPG, PNG, WebP, GIF). Max 5MB. Recommended size: 200x200px or square aspect ratio."
                      className="w-full"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    Store Banner
                  </Label>
                  {formData.banner_url ? (
                    <div className="space-y-3">
                      <div className="w-full h-32 relative border-2 border-slate-200 rounded-lg overflow-hidden">
                        <Image
                          src={formData.banner_url}
                          alt="Store Banner"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, banner_url: "" })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Banner
                      </Button>
                    </div>
                  ) : (
                    <CloudinaryUpload
                      onUpload={(url) => setFormData({ ...formData, banner_url: url })}
                      maxImages={1}
                      folder="sandbox/banners"
                      label="Upload Store Banner"
                      description="Upload your store banner (JPG, PNG, WebP, GIF). Max 5MB. Recommended size: 1200x400px for best results."
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your store will look to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Preview Header */}
                <div className="border-b bg-background/95 p-4">
                  <div className="flex items-center gap-3">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url || "/placeholder.svg"}
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
                {formData.banner_url && (
                  <div className="h-32 relative bg-gray-100">
                    <img
                      src={formData.banner_url || "/placeholder.svg"}
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

          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
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
