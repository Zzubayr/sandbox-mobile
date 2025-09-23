import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-utils"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Get vendor statistics
    const [totalResult, pendingResult, approvedResult, rejectedResult, activeResult] = await Promise.all([
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('approval_status', 'rejected'),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('approval_status', 'approved')
    ])

    // Get product statistics
    const [totalProductsResult, activeProductsResult] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active')
    ])

    // Get request statistics
    const [totalRequestsResult, pendingRequestsResult, completedRequestsResult] = await Promise.all([
      supabase.from('requests').select('id', { count: 'exact', head: true }),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'completed')
    ])

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [recentVendorsResult, recentProductsResult, recentRequestsResult] = await Promise.all([
      supabase.from('vendors').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('products').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('requests').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString())
    ])

    const stats = {
      vendors: {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        active: activeResult.count || 0
      },
      products: {
        total: totalProductsResult.count || 0,
        active: activeProductsResult.count || 0
      },
      requests: {
        total: totalRequestsResult.count || 0,
        pending: pendingRequestsResult.count || 0,
        completed: completedRequestsResult.count || 0
      },
      recentActivity: {
        vendors: recentVendorsResult.count || 0,
        products: recentProductsResult.count || 0,
        requests: recentRequestsResult.count || 0
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
