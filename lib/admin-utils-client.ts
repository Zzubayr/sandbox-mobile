import { createClient } from "@/lib/supabase/client"
import type { Admin, Vendor } from "@/lib/types"

/**
 * Check if a user is an admin (client-side)
 */
export async function isAdminClient(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  return !!data
}

/**
 * Get admin role for a user (client-side)
 */
export async function getAdminRoleClient(userId: string): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .single()
  
  return data?.role || null
}

/**
 * Get admin information for a user (client-side)
 */
export async function getAdminInfoClient(userId: string): Promise<Admin | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return data
}

/**
 * Get all vendors with approval status (client-side, admin only)
 */
export async function getAllVendorsClient(): Promise<Vendor[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching vendors:', error)
    return []
  }
  
  return data || []
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
    const response = await fetch(`/api/admin/vendors/${vendorId}`, {
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
  const supabase = createClient()
  
  const [totalResult, pendingResult, approvedResult, rejectedResult, activeResult] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('approval_status', 'rejected'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('approval_status', 'approved')
  ])
  
  return {
    total: totalResult.count || 0,
    pending: pendingResult.count || 0,
    approved: approvedResult.count || 0,
    rejected: rejectedResult.count || 0,
    active: activeResult.count || 0
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
