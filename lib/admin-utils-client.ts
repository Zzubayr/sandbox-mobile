import type { Admin, Vendor } from "@/lib/types"

/**
 * Check if a user is an admin (client-side)
 */
export async function isAdminClient(userId: string): Promise<boolean> {
  // Prefer using the server-side requireAdmin or call /api/auth/role from the client
  const res = await fetch('/api/auth/role', { cache: 'no-store' })
  if (!res.ok) return false
  const { role } = await res.json()
  return !!role
}

/**
 * Get admin role for a user (client-side)
 */
export async function getAdminRoleClient(userId: string): Promise<string | null> {
  const res = await fetch('/api/auth/role', { cache: 'no-store' })
  if (!res.ok) return null
  const { role } = await res.json()
  return role ?? null
}

/**
 * Get admin information for a user (client-side)
 */
export async function getAdminInfoClient(userId: string): Promise<Admin | null> {
  // Not exposed as a public API. Use role endpoint or create a new protected API if needed.
  return null
}

/**
 * Get all vendors with approval status (client-side, admin only)
 */
export async function getAllVendorsClient(): Promise<Vendor[]> {
  const res = await fetch('/api/admin/vendors', { cache: 'no-store' })
  if (!res.ok) return []
  const { vendors } = await res.json()
  return vendors || []
}

/**
 * Approve a vendor (admin only)
 */
export async function approveVendor(vendorId: string, adminNotes?: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminNotes }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error approving vendor:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error approving vendor:', error)
    return false
  }
}

/**
 * Reject a vendor (admin only)
 */
export async function rejectVendor(vendorId: string, adminNotes?: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/vendors/${vendorId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminNotes }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error rejecting vendor:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error rejecting vendor:', error)
    return false
  }
}

/**
 * Delete a vendor and all related data (admin only)
 */
export async function deleteVendor(vendorId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/vendors?vendorId=${vendorId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error deleting vendor:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return false
  }
}

/**
 * Get vendor statistics for admin dashboard (client-side)
 */
export async function getVendorStatsClient(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  active: number
}> {
  const res = await fetch('/api/admin/stats', { cache: 'no-store' })
  if (!res.ok) {
    return { total: 0, pending: 0, approved: 0, rejected: 0, active: 0 }
  }
  const data = await res.json()
  const vendors = data?.vendors || {}
  return {
    total: vendors.total || 0,
    pending: vendors.pending || 0,
    approved: vendors.approved || 0,
    rejected: vendors.rejected || 0,
    active: vendors.active || 0,
  }
}

/**
 * Check if vendor storefront should be accessible
 */
export function isVendorStorefrontAccessible(vendor: Vendor): boolean {
  return vendor.is_active && vendor.approval_status === 'approved'
}

/**
 * Get approval status badge color
 */
export function getApprovalStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get approval status icon
 */
export function getApprovalStatusIcon(status: string): string {
  switch (status) {
    case 'approved':
      return '✅'
    case 'rejected':
      return '❌'
    case 'pending':
      return '⏳'
    default:
      return '❓'
  }
}
