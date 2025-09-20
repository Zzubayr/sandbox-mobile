import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Phone, Package, Calendar } from "lucide-react"
import Link from "next/link"
import { WhatsAppContactCard } from "@/components/whatsapp/whatsapp-contact-card"
import { createVendorContactMessage } from "@/lib/whatsapp"

export default async function RequestDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get vendor info
  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).single()

  if (!vendor) {
    redirect("/auth/login")
  }

  // Get request details
  const { data: request } = await supabase
    .from("requests")
    .select(`
      *,
      request_items (
        *,
        product:products (title, price, images)
      )
    `)
    .eq("id", params.id)
    .eq("vendor_id", vendor.id)
    .single()

  if (!request) {
    redirect("/dashboard/requests")
  }

  const whatsappMessage = createVendorContactMessage({
    vendorNumber: vendor.whatsapp_number || "",
    customerName: request.customer_name,
    requestId: request.id,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Request #{request.id.slice(-8)}</h1>
          <p className="text-muted-foreground">Created on {new Date(request.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Summary</CardTitle>
                <Badge
                  variant={
                    request.status === "pending"
                      ? "default"
                      : request.status === "completed"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Items:</span>
                    <p className="font-medium">{request.request_items?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="font-medium text-lg">${request.total_amount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium capitalize">{request.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Items Requested</h4>
                  <div className="space-y-3">
                    {request.request_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.product?.title}</p>
                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">${item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {request.customer_note && (
                  <div>
                    <h4 className="font-medium mb-2">Customer Note</h4>
                    <p className="text-sm text-muted-foreground italic p-3 bg-gray-50 rounded-lg">
                      "{request.customer_note}"
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Info & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{request.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(request.created_at).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {vendor.whatsapp_number && (
            <WhatsAppContactCard
              vendorName="Customer"
              vendorNumber={vendor.whatsapp_number}
              message={whatsappMessage}
              title="Contact Customer"
              description="Reach out via WhatsApp to discuss this request"
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full bg-transparent">
                Update Status
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Send Invoice
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Mark as Completed
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
