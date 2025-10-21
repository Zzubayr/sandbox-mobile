"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { StorefrontHeader } from "@/components/storefront/header"
import { PendingApprovalPage } from "@/components/storefront/pending-approval-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Package, 
  User, 
  Phone, 
  MessageCircle,
  Copy,
  ExternalLink,
  Calendar,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import type { Vendor, Request } from "@/lib/types"
import { getThemeColors } from "@/lib/theme-colors"
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button"
import { WhatsAppMessageCustomizer } from "@/components/whatsapp/whatsapp-message-customizer"
import { createDetailedCustomerRequestMessage } from "@/lib/whatsapp"
import { toastHelpers } from "@/lib/toast-helpers"

export default function CustomerRequestPage() {
  const params = useParams()
  const slug = params.slug as string
  const requestId = params.requestId as string

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
      } catch (error) {
        console.error("Error fetching request:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, requestId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const copyRequestLink = () => {
    const link = `${window.location.origin}/store/${slug}/request/${requestId}`
    navigator.clipboard.writeText(link)
    toastHelpers.success("Link Copied", "Request link copied to clipboard!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading request details...</p>
        </div>
      </div>
    )
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
          <p className="text-muted-foreground mb-4">The request you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const colors = getThemeColors(vendor.theme_color)
  const requestUrl = `${window.location.origin}/store/${slug}/request/${requestId}`

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Request Details</h1>
              <p className="text-muted-foreground">Request #{request.id.slice(-8)}</p>
            </div>
            <Badge className={`${getStatusColor(request.status)} flex items-center gap-2`}>
              {getStatusIcon(request.status)}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{request.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{request.customer_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(request.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-lg" style={{ color: colors.primary }}>
                          ₦{request.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {request.customer_note && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Customer Note</p>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm italic">"{request.customer_note}"</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Requested Items</CardTitle>
                  <CardDescription>
                    {request.request_items?.length || 0} items in this request
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {request.request_items?.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ₦{item.price.toLocaleString()}
                            </p>
                            {item.product?.attributes && Object.keys(item.product.attributes).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">Specifications:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(item.product.attributes).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {key}: {String(value)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₦{(item.quantity * item.price).toLocaleString()}</p>
                          </div>
                        </div>
                        {index < (request.request_items?.length || 0) - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={copyRequestLink} variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Request Link
                  </Button>

                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/store/${vendor.store_slug}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Store
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Store Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Store Name</p>
                    <p className="font-medium">{vendor.store_name}</p>
                  </div>
                  {vendor.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{vendor.description}</p>
                    </div>
                  )}
                  {vendor.whatsapp_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="text-sm font-medium">{vendor.whatsapp_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="text-sm">
                        {request.status === "pending" && "Your request is being reviewed"}
                        {request.status === "completed" && "Your request has been completed"}
                        {request.status === "cancelled" && "Your request has been cancelled"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {formatDate(request.updated_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* WhatsApp Message Customizer */}
          {vendor.whatsapp_number && (
            <div className="mt-8">
              <WhatsAppMessageCustomizer
                options={{
                  vendorNumber: vendor.whatsapp_number,
                  customerName: request.customer_name,
                  requestId: request.id,
                  storeName: vendor.store_name,
                  totalAmount: request.total_amount,
                  itemCount: request.request_items?.length || 0,
                  requestUrl: requestUrl,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
