import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getAdminRole } from "@/lib/admin-utils"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const adminRole = await getAdminRole(user.id)
    if (adminRole !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    // Get all vendors (users who have created stores) and existing admins
    const [vendorsResult, adminsResult] = await Promise.all([
      supabase
        .from('vendors')
        .select('user_id, store_name, email')
        .order('created_at', { ascending: false }),
      supabase
        .from('admins')
        .select('user_id')
    ])

    if (vendorsResult.error) {
      console.error('Error fetching vendors:', vendorsResult.error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Get existing admin user IDs
    const existingAdminIds = new Set(adminsResult.data?.map(admin => admin.user_id) || [])

    // Transform vendors to users format, excluding existing admins
    const users = vendorsResult.data
      ?.filter(vendor => !existingAdminIds.has(vendor.user_id))
      .map(vendor => ({
        id: vendor.user_id,
        email: vendor.email || `${vendor.store_name} (No email)`,
        store_name: vendor.store_name
      })) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
