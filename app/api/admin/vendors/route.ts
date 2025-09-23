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

    // Get all vendors with approval status
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendors:', error)
      return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
    }

    return NextResponse.json({ vendors: vendors || [] })
  } catch (error) {
    console.error('Admin vendors API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 })
    }

    // Delete vendor using the cascade function
    const { error } = await supabase.rpc('delete_vendor_cascade', {
      vendor_id: vendorId
    })

    if (error) {
      console.error('Error deleting vendor:', error)
      return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Vendor deleted successfully" })
  } catch (error) {
    console.error('Admin delete vendor API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
