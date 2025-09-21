"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"
import { toastHelpers } from "@/lib/toast-helpers"
import { Loader2, Store, Palette, Phone, ArrowRight, Check, Sparkles } from "lucide-react"

const THEME_OPTIONS = [
  { 
    value: "blue", 
    label: "Ocean Blue", 
    
    description: "Professional and trustworthy",
    color: "bg-blue-500",
    gradient: "from-blue-400 to-blue-600",
    preview: "bg-gradient-to-br from-blue-50 to-blue-100"
  },
  { 
    value: "green", 
    label: "Forest Green", 
    description: "Natural and growth-focused",
    color: "bg-green-500",
    gradient: "from-green-400 to-green-600",
    preview: "bg-gradient-to-br from-green-50 to-green-100"
  },
  { 
    value: "purple", 
    label: "Royal Purple", 
    description: "Creative and premium",
    color: "bg-purple-500",
    gradient: "from-purple-400 to-purple-600",
    preview: "bg-gradient-to-br from-purple-50 to-purple-100"
  },
]

const generateStoreSlug = (storeName: string): string => {
  return (
    storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, "") || // Remove leading/trailing hyphens
    "store"
  ) // Fallback if empty
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    store_name: "",
    description: "",
    whatsapp_number: "",
    theme_color: "blue" as "blue" | "green" | "purple",
  })
  const router = useRouter()
  const supabase = createClient()
  const { setTheme } = useTheme()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      console.log("[v0] Checking user authentication...")
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("[v0] Error getting user:", userError)
        router.push("/auth/login")
        return
      }

      if (!user) {
        console.log("[v0] No user found, redirecting to login")
        router.push("/auth/login")
        return
      }

      console.log("[v0] User found:", user.id, user.email)
      setUser(user)
      console.log("[v0] User state set")

      console.log("[v0] Checking vendor profile...")
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() // Use maybeSingle instead of single to handle no results

      if (vendorError) {
        console.error("[v0] Error fetching vendor profile:", vendorError)
        // Continue with onboarding even if there's an error
      } else if (vendor) {
        console.log("[v0] Vendor profile found:", vendor)
        // Pre-fill form with existing data
        setFormData({
          store_name: vendor.store_name || "",
          description: vendor.description || "",
          whatsapp_number: vendor.whatsapp_number || "",
          theme_color: vendor.theme_color || "blue",
        })

        // If profile is complete, redirect to dashboard
        if (vendor.whatsapp_number && vendor.store_name) {
          console.log("[v0] Profile complete, redirecting to dashboard")
          router.push("/dashboard")
          return
        }
      } else {
        console.log("[v0] No vendor profile found, will create one during onboarding")
      }
    } catch (error) {
      console.error("[v0] Unexpected error in checkUser:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!user) {
      alert("No user found. Please try logging in again.")
      return
    }

    if (!formData.store_name || !formData.whatsapp_number) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {

      const { data: existingVendor, error: checkError } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking existing vendor:", checkError)
        throw checkError
      }

      let error
      if (existingVendor) {
        // Update existing vendor
        console.log("[v0] Updating existing vendor profile...")
        const { error: updateError } = await supabase
          .from("vendors")
          .update({
            store_name: formData.store_name,
            store_slug: generateStoreSlug(formData.store_name),
            description: formData.description,
            whatsapp_number: formData.whatsapp_number,
            theme_color: formData.theme_color,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        error = updateError
      } else {
        // Insert new vendor
        console.log("[v0] Creating new vendor profile...")
        const { error: insertError } = await supabase.from("vendors").insert({
          user_id: user.id,
          store_name: formData.store_name,
          store_slug: generateStoreSlug(formData.store_name),
          description: formData.description,
          whatsapp_number: formData.whatsapp_number,
          theme_color: formData.theme_color,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        error = insertError
      }

      if (error) {
        console.error("[v0] Error updating vendor profile:", error)
        throw error
      }

      // Apply theme immediately
      setTheme(formData.theme_color)
      toastHelpers.success("Store Created!", "Your store has been set up successfully")
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error in handleSubmit:", error)
      const errorMessage = error.message || 'Unknown error'
      toastHelpers.error("Setup Failed", `Error creating your store: ${errorMessage}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.store_name.trim().length > 0
      case 2:
        return formData.whatsapp_number.trim().length > 0
      case 3:
        return true
      default:
        return false
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Sandbox
              </h1>
            </div>
            <p className="text-xl text-slate-600">Let's create your amazing store</p>
          </div>

          {/* Progress */}
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i <= step 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                    : "bg-white text-slate-400 border-2 border-slate-200"
                }`}>
                  {i < step ? <Check className="w-5 h-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-8 h-0.5 ${i < step ? "bg-blue-500" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  {step === 1 && <Store className="w-6 h-6 text-white" />}
                  {step === 2 && <Phone className="w-6 h-6 text-white" />}
                  {step === 3 && <Palette className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    {step === 1 && "Store Information"}
                    {step === 2 && "Contact Details"}
                    {step === 3 && "Choose Your Theme"}
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    {step === 1 && "Tell us about your amazing store"}
                    {step === 2 && "How customers can reach you"}
                    {step === 3 && "Pick a color that represents your brand"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Store Name *</Label>
                    <Input
                      id="store_name"
                      placeholder="My Awesome Store"
                      value={formData.store_name}
                      onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell customers what makes your store special..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+1234567890"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Include country code (e.g., +1 for US, +44 for UK)</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    {THEME_OPTIONS.map((theme) => (
                      <div
                        key={theme.value}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          formData.theme_color === theme.value
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md"
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, theme_color: theme.value })
                          setTheme(theme.value)
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-lg flex items-center justify-center`}>
                            <div className="w-6 h-6 rounded-full bg-white/20"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 text-lg">{theme.label}</h3>
                            <p className="text-slate-600 text-sm">{theme.description}</p>
                          </div>
                          {formData.theme_color === theme.value && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <Badge className="bg-blue-500 text-white">
                                Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                        {/* Preview */}
                        <div className={`mt-4 p-4 rounded-xl ${theme.preview} border border-white/50`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradient}`}></div>
                            <div className="flex-1">
                              <div className={`h-2 rounded-full bg-gradient-to-r ${theme.gradient} mb-2`}></div>
                              <div className="h-1 rounded-full bg-slate-300 w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Helpful message after theme selection */}
                  {formData.theme_color && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          Great choice! Your store will use the {THEME_OPTIONS.find(t => t.value === formData.theme_color)?.label} theme.
                        </p>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Click "Complete Setup" below to finish creating your store.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-6">
                {step > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    className="flex-1 h-12 bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button 
                    onClick={handleNext} 
                    disabled={!isStepValid()} 
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating your store...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
