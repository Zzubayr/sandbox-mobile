"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { StorefrontHeader } from "@/components/storefront/header"
import { PendingApprovalPage } from "@/components/storefront/pending-approval-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Vendor, Request } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button"
import { WhatsAppContactCard } from "@/components/whatsapp/whatsapp-contact-card"
import { createDetailedCustomerRequestMessage } from "@/lib/whatsapp"

export default function RequestSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const requestId = searchParams.get("requestId")

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!requestId) return

      try {
        const res = await fetch(`/api/store/${slug}/request/${requestId}`, { cache: 'no-store' })
        if (!res.ok) {
          setLoading(false)
          return
        }
        const { vendor, request } = await res.json()
        if (vendor?.approval_status !== 'approved') {
          setVendor(vendor)
          setRequest(null)
          setLoading(false)
          return
        }
        setVendor(vendor)
        setRequest(request)
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, requestId])

  const copyRequestLink = () => {
    navigator.clipboard.writeText(requestUrl)
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">The store you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Show pending approval page if store is not approved
  if (vendor.approval_status !== 'approved') {
    return <PendingApprovalPage vendor={vendor} />
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Request Not Found</h1>
          <p className="text-muted-foreground mb-4">The request you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const colors = getThemeColors(vendor.theme_color)

  const requestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/store/${slug}/request/${requestId}`
    : `/store/${slug}/request/${requestId}`
  
  const whatsappMessage = createDetailedCustomerRequestMessage({
    vendorNumber: vendor.whatsapp_number || "",
    customerName: request.customer_name,
    requestId: request.id,
    storeName: vendor.store_name,
    totalAmount: request.total_amount,
    itemCount: request.request_items?.length || 0,
    requestUrl: requestUrl,
  })

  return (
    <div className="min-h-screen bg-background">
        <StorefrontHeader vendor={vendor} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: colors.light }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Request Created!</h1>
            <p className="text-muted-foreground">
              Your request has been successfully created. You can now share the request link with the vendor.
            </p>
          </div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Request #{request.id.slice(-8)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{request.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{request.customer_phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Items:</span>
                  <p className="font-medium">{request.request_items?.length || 0} items</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium text-lg" style={{ color: colors.primary }}>
                    ₦{request.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {request.customer_note && (
                <div>
                  <span className="text-muted-foreground text-sm">Your Note:</span>
                  <p className="text-sm italic mt-1">"{request.customer_note}"</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-4">
            {vendor.whatsapp_number && (
              <WhatsAppButton
                options={{
                  vendorNumber: vendor.whatsapp_number,
                  message: whatsappMessage,
                }}
                size="lg"
                className="w-full"
              >
                Open WhatsApp
              </WhatsAppButton>
            )}

            <Button onClick={copyRequestLink} variant="outline" className="w-full bg-transparent" size="lg">
              <Copy className="mr-2 h-5 w-5" />
              Copy Request Link
            </Button>

            <Button asChild className="w-full" size="lg" style={{ backgroundColor: colors.primary }}>
              <Link href={`/store/${slug}/request/${requestId}`}>
                <ExternalLink className="mr-2 h-5 w-5" />
                View Request Details
              </Link>
            </Button>

            <div className="flex gap-4">
              <Button variant="outline" asChild className="flex-1 bg-transparent">
                <Link href={`/store/${vendor.store_slug}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Store
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Add WhatsApp contact card for better UX */}
          {vendor.whatsapp_number && (
            <div className="mt-8">
              <WhatsAppContactCard
                vendorName={vendor.store_name}
                vendorNumber={vendor.whatsapp_number}
                message={whatsappMessage}
                title="Need Help?"
                description="Contact the vendor directly for questions about your request"
              />
            </div>
          )}
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <p className="text-sm text-muted-foreground">
                The vendor will receive your request and contact you via WhatsApp to confirm availability, discuss
                pricing, and arrange delivery or pickup.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
