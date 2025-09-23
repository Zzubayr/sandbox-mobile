import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-utils"

export async function POST(
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

    const { adminNotes } = await request.json()

    // Update vendor approval status
    const { data, error } = await supabase
      .from('vendors')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        admin_notes: adminNotes || null
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error approving vendor:', error)
      return NextResponse.json({ error: "Failed to approve vendor" }, { status: 500 })
    }

    return NextResponse.json({ vendor: data })
  } catch (error) {
    console.error('Error in approve vendor API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}