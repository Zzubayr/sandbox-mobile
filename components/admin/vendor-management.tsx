"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Users, 
  Search, 
  MoreHorizontal, 
  Check, 
  X, 
  Trash2, 
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import type { Vendor } from "@/lib/types"
import { 
  getApprovalStatusColor, 
  getApprovalStatusIcon,
  approveVendor,
  rejectVendor,
  deleteVendor
} from "@/lib/admin-utils-client"
import { toastHelpers } from "@/lib/toast-helpers"
import Link from "next/link"

interface VendorManagementProps {
  initialVendors?: Vendor[]
}

export function VendorManagement({ initialVendors = [] }: VendorManagementProps) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | 'delete' | null
    vendor: Vendor | null
  }>({
    isOpen: false,
    action: null,
    vendor: null
  })
  const [adminNotes, setAdminNotes] = useState("")

  // Fetch vendors on component mount
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/vendors')
        if (response.ok) {
          const data = await response.json()
          setVendors(data.vendors || [])
        }
      } catch (error) {
        console.error('Error fetching vendors:', error)
      } finally {
        setLoading(false)
      }
    }

    if (initialVendors.length === 0) {
      fetchVendors()
    }
  }, [initialVendors.length])

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.store_slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAction = async (action: 'approve' | 'reject' | 'delete', vendor: Vendor) => {
    setActionDialog({
      isOpen: true,
      action,
      vendor
    })
    setAdminNotes("")
  }

  const confirmAction = async () => {
    if (!actionDialog.vendor || !actionDialog.action) return

    setLoading(true)
    try {
      let success = false
      
      switch (actionDialog.action) {
        case 'approve':
          success = await approveVendor(actionDialog.vendor.id, adminNotes)
          if (success) {
            toastHelpers.success("Vendor Approved", "Vendor has been approved successfully")
            // Update local state
            setVendors(prev => prev.map(v => 
              v.id === actionDialog.vendor!.id 
                ? { ...v, approval_status: 'approved', admin_notes: adminNotes, approved_at: new Date().toISOString() }
                : v
            ))
          }
          break
        case 'reject':
          success = await rejectVendor(actionDialog.vendor.id, adminNotes)
          if (success) {
            toastHelpers.success("Vendor Rejected", "Vendor has been rejected")
            // Update local state
            setVendors(prev => prev.map(v => 
              v.id === actionDialog.vendor!.id 
                ? { ...v, approval_status: 'rejected', admin_notes: adminNotes, approved_at: new Date().toISOString() }
                : v
            ))
          }
          break
        case 'delete':
          success = await deleteVendor(actionDialog.vendor.id)
          if (success) {
            toastHelpers.success("Vendor Deleted", "Vendor and all related data have been deleted")
            // Remove from local state
            setVendors(prev => prev.filter(v => v.id !== actionDialog.vendor!.id))
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
        action: null,
        vendor: null
      })
      setAdminNotes("")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Manage vendor approvals and store access</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">{vendors.length} vendors</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vendors.filter(v => v.approval_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vendors.filter(v => v.approval_status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vendors.filter(v => v.approval_status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => window.open(`/admin/vendors/${vendor.id}`, '_blank')}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.store_name}</div>
                      <div className="text-sm text-gray-500">/{vendor.store_slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getApprovalStatusColor(vendor.approval_status)}>
                      {getApprovalStatusIcon(vendor.approval_status)} {vendor.approval_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {vendor.approved_by ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Approved by Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          Not approved
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendors/${vendor.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {vendor.approval_status !== 'approved' && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('approve', vendor)
                            }}
                            className="text-green-600 cursor-pointer"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {vendor.approval_status !== 'rejected' && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('reject', vendor)
                            }}
                            className="text-red-600 cursor-pointer"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction('delete', vendor)
                          }}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
          
          {actionDialog.vendor && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{actionDialog.vendor.store_name}</h4>
                <p className="text-sm text-gray-500">/{actionDialog.vendor.store_slug}</p>
                <p className="text-sm text-gray-500 mt-1">{actionDialog.vendor.description}</p>
              </div>
            </div>
          )}

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
                action: null,
                vendor: null
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
