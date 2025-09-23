import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-utils"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Delete vendor and all related data in the correct order
    // First delete request items
    await supabase
      .from('request_items')
      .delete()
      .eq('vendor_id', params.id)

    // Then delete requests
    await supabase
      .from('requests')
      .delete()
      .eq('vendor_id', params.id)

    // Delete products
    await supabase
      .from('products')
      .delete()
      .eq('vendor_id', params.id)

    // Delete categories
    await supabase
      .from('categories')
      .delete()
      .eq('vendor_id', params.id)

    // Finally delete the vendor
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting vendor:', error)
      return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete vendor API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
