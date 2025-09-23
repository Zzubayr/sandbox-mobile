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

    // Get all admins with vendor information
    const { data: admins, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 })
    }

    // Get vendor information for each admin
    const adminsWithUsers = await Promise.all(
      (admins || []).map(async (admin) => {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('email, store_name')
          .eq('user_id', admin.user_id)
          .single()

        return {
          ...admin,
          user: {
            email: vendor?.email || `${vendor?.store_name || 'Unknown'} (No email)`
          }
        }
      })
    )

    return NextResponse.json({ admins: adminsWithUsers })
  } catch (error) {
    console.error('Error in admins API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 })
    }

    // Verify the user exists as a vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, store_name, email')
      .eq('user_id', userId)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "User not found or not a vendor" }, { status: 400 })
    }

    // Check if user is already an admin
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingAdmin) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 400 })
    }

    // Create new admin
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        user_id: userId,
        role: role,
        created_by: user.id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json({ error: "Failed to create admin" }, { status: 500 })
    }

    // Return admin with vendor info
    const adminWithUser = {
      ...admin,
      user: {
        email: vendor.email || `${vendor.store_name} (No email)`
      }
    }

    return NextResponse.json({ admin: adminWithUser })
  } catch (error) {
    console.error('Error in create admin API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
