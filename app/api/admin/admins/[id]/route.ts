import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getAdminRole } from "@/lib/admin-utils"

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

    // Check if user is super admin
    const adminRole = await getAdminRole(user.id)
    if (adminRole !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    // Don't allow deleting yourself
    const { data: adminToDelete } = await supabase
      .from('admins')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (adminToDelete?.user_id === user.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 })
    }

    // Delete admin
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting admin:', error)
      return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete admin API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
