"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  Check, 
  X, 
  Trash2, 
  Store,
  Package,
  ShoppingCart,
  Calendar,
  User,
  Mail,
  Phone,
  Globe,
  Edit,
  Eye
} from "lucide-react"
import type { Vendor, Product, Request } from "@/lib/types"
import { 
  getApprovalStatusColor, 
  getApprovalStatusIcon,
  approveVendor,
  rejectVendor,
  deleteVendor
} from "@/lib/admin-utils-client"
import { toastHelpers } from "@/lib/toast-helpers"
import Link from "next/link"

interface VendorDetailPageProps {
  vendor: Vendor
  products: Product[]
  requests: Request[]
}

export function VendorDetailPage({ vendor, products, requests }: VendorDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | 'delete' | null
  }>({
    isOpen: false,
    action: null
  })
  const [adminNotes, setAdminNotes] = useState("")

  const handleAction = async (action: 'approve' | 'reject' | 'delete') => {
    setActionDialog({
      isOpen: true,
      action
    })
    setAdminNotes("")
  }

  const confirmAction = async () => {
    if (!actionDialog.action) return

    setLoading(true)
    try {
      let success = false
      
      switch (actionDialog.action) {
        case 'approve':
          success = await approveVendor(vendor.id, adminNotes)
          if (success) {
            toastHelpers.success("Vendor Approved", "Vendor has been approved successfully")
            router.push("/admin/vendors")
          }
          break
        case 'reject':
          success = await rejectVendor(vendor.id, adminNotes)
          if (success) {
            toastHelpers.success("Vendor Rejected", "Vendor has been rejected")
            router.push("/admin/vendors")
          }
          break
        case 'delete':
          success = await deleteVendor(vendor.id)
          if (success) {
            toastHelpers.success("Vendor Deleted", "Vendor and all related data have been deleted")
            router.push("/admin/vendors")
          }
          break
      }

      if (!success) {
        toastHelpers.error("Action Failed", "Failed to perform the requested action")
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toastHelpers.error("Action Failed", "An unexpected error occurred")
    } finally {
      setLoading(false)
      setActionDialog({
        isOpen: false,
        action: null
      })
      setAdminNotes("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/vendors")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.store_name}</h1>
            <p className="text-gray-600">Vendor Details & Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getApprovalStatusColor(vendor.approval_status)}>
            {getApprovalStatusIcon(vendor.approval_status)} {vendor.approval_status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Vendor Information */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Store Name</label>
                  <p className="text-lg font-semibold">{vendor.store_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Store Slug</label>
                  <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">/{vendor.store_slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Theme Color</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: vendor.theme_color === 'blue' ? '#3B82F6' : vendor.theme_color === 'green' ? '#10B981' : '#8B5CF6' }}
                    />
                    <span className="capitalize">{vendor.theme_color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg">
                    <Badge className={getApprovalStatusColor(vendor.approval_status)}>
                      {getApprovalStatusIcon(vendor.approval_status)} {vendor.approval_status}
                    </Badge>
                  </p>
                </div>
              </div>
              
              {vendor.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700 mt-1">{vendor.description}</p>
                </div>
              )}

              {vendor.whatsapp_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">WhatsApp Number</label>
                  <p className="text-gray-700 mt-1">{vendor.whatsapp_number}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.slice(0, 5).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No products found</p>
              )}
            </CardContent>
          </Card>

          {/* Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.customer_name}</p>
                            <p className="text-sm text-gray-500">{request.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${request.total_amount}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No requests found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendor.approval_status !== 'approved' && (
                <Button 
                  onClick={() => handleAction('approve')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Vendor
                </Button>
              )}
              
              {vendor.approval_status !== 'rejected' && (
                <Button 
                  onClick={() => handleAction('reject')}
                  variant="destructive"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Vendor
                </Button>
              )}

              <Button 
                onClick={() => handleAction('delete')}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Vendor
              </Button>

              <Button 
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href={`/store/${vendor.store_slug}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Storefront
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Store Details */}
          <Card>
            <CardHeader>
              <CardTitle>Store Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Created: {new Date(vendor.created_at).toLocaleDateString()}</span>
              </div>
              
              {vendor.approved_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gray-400" />
                  <span>
                    {vendor.approval_status === 'approved' ? 'Approved' : 'Rejected'}: {' '}
                    {new Date(vendor.approved_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              {vendor.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                    {vendor.admin_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => 
        setActionDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Approve Vendor'}
              {actionDialog.action === 'reject' && 'Reject Vendor'}
              {actionDialog.action === 'delete' && 'Delete Vendor'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve' && 'Are you sure you want to approve this vendor? Their storefront will become visible to customers.'}
              {actionDialog.action === 'reject' && 'Are you sure you want to reject this vendor? They will not be able to access their storefront.'}
              {actionDialog.action === 'delete' && 'Are you sure you want to delete this vendor? This will permanently delete the vendor and ALL their data including products, requests, and categories. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium">{vendor.store_name}</h4>
              <p className="text-sm text-gray-500">/{vendor.store_slug}</p>
              <p className="text-sm text-gray-500 mt-1">{vendor.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add notes about this action..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({
                isOpen: false,
                action: null
              })}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAction}
              disabled={loading}
              className={
                actionDialog.action === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : actionDialog.action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {loading ? 'Processing...' : 
                actionDialog.action === 'approve' ? 'Approve' :
                actionDialog.action === 'reject' ? 'Reject' :
                'Delete'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
