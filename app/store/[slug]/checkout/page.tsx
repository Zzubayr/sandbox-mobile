"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StorefrontHeader } from "@/components/storefront/header"
import { PendingApprovalPage } from "@/components/storefront/pending-approval-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import type { Vendor } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { toastHelpers } from "@/lib/toast-helpers"

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { state, dispatch } = useCart()

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerNote: "",
  })

  useEffect(() => {
    async function fetchVendor() {
      const supabase = createClient()

      const { data: vendorData, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("store_slug", slug)
        .eq("is_active", true)
        .single()

      if (error || !vendorData) {
        router.push("/")
        return
      }

      // Check if store is approved
      if (vendorData.approval_status !== 'approved') {
        setVendor(vendorData)
        setLoading(false)
        return
      }

      setVendor(vendorData)
      setLoading(false)
    }

    fetchVendor()
  }, [slug, router])

  // useEffect(() => {
  //   // Only redirect if cart is empty AND we're sure it's loaded AND we're not submitting
  //   if (!loading && state.isLoaded && state.items.length === 0 && !submitting) {
  //     router.push(`/store/${slug}`)
  //   }
  // }, [loading, state.isLoaded, state.items.length, submitting, router, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor || state.items.length === 0) return

    setSubmitting(true)

    try {
      const supabase = createClient()

      // Create the request
      const { data: request, error: requestError } = await supabase
        .from("requests")
        .insert({
          vendor_id: vendor.id,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_note: formData.customerNote || null,
          total_amount: state.total,
          status: "pending",
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Create request items
      const requestItems = state.items.map((item: { product: any; quantity: number }) => ({
        request_id: request.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }))

      const { error: itemsError } = await supabase.from("request_items").insert(requestItems)

      if (itemsError) throw itemsError

      // Show success toast
      toastHelpers.requestSubmitted()

      // Clear cart only after successful request creation
      dispatch.clearCart()

      // Redirect to success page
      router.push(`/store/${slug}/request-success?requestId=${request.id}`)
    } catch (error) {
      console.error("Error creating request:", error)
      toastHelpers.error("Request Failed", "Failed to create request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleMobileSubmit = () => {
    const form = document.getElementById("checkout-form") as HTMLFormElement
    if (form) {
      form.requestSubmit()
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!vendor) {
    return null
  }

  // Show pending approval page if store is not approved
  if (vendor.approval_status !== 'approved') {
    return <PendingApprovalPage vendor={vendor} />
  }

  if (state.items.length === 0) {
    return null
  }

  const colors = getThemeColors(vendor.theme_color)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <StorefrontHeader vendor={vendor} cartItemCount={state.itemCount} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link href={`/store/${vendor.store_slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Review Your Request</h1>
          <p className="text-sm md:text-base text-muted-foreground text-pretty">
            Complete your information to send your request to {vendor.store_name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Order Summary */}
          <div className="space-y-6 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
                <CardDescription>{state.itemCount} items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.items.map((item: { product: any; quantity: number }) => (
                  <div key={item.product.id} className="flex gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-2 text-sm md:text-base">{item.product.title}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        ₦{item.product.price.toLocaleString()} × {item.quantity}
                      </p>
                      <p className="font-medium text-sm md:text-base">
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₦{state.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>Calculated at next step</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base md:text-lg font-bold">
                    <span>Total:</span>
                    <span style={{ color: colors.primary }}>₦{state.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div className="space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Your Information</CardTitle>
                <CardDescription className="text-sm">We'll use this to contact you about your request</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-sm font-medium">
                      Full Name *
                    </Label>
                    <Input
                      id="customerName"
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Enter your full name"
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-sm font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerNote" className="text-sm font-medium">
                      Note (Optional)
                    </Label>
                    <Textarea
                      id="customerNote"
                      value={formData.customerNote}
                      onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
                      placeholder="Any special requests or notes for the vendor..."
                      rows={4}
                      className="text-base resize-none"
                    />
                  </div>

                  {/* Desktop Submit Button */}
                  <Button
                    type="submit"
                    className="w-full hidden md:flex"
                    size="lg"
                    disabled={submitting}
                    style={{ backgroundColor: colors.primary }}
                  >
                    {submitting ? (
                      "Creating Request..."
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Create Request & DM on WhatsApp
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center text-pretty">
                    By creating a request, you agree to be contacted by {vendor.store_name} via WhatsApp to finalize
                    your order.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Submit Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden z-50">
        <Button
          onClick={handleMobileSubmit}
          className="w-full"
          size="lg"
          disabled={submitting}
          style={{ backgroundColor: colors.primary }}
        >
          {submitting ? (
            "Creating Request..."
          ) : (
            <>
              <MessageCircle className="mr-2 h-5 w-5" />
              Create Request & DM on WhatsApp
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
