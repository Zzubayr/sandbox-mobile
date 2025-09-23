import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getAdminRole } from "@/lib/admin-utils"
import { AdminManagement } from "@/components/admin/admin-management"

export default async function AdminAdminsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin(user.id)
  if (!userIsAdmin) {
    redirect("/dashboard")
  }

  // Check if user is super admin
  const adminRole = await getAdminRole(user.id)
  if (adminRole !== 'super_admin') {
    redirect("/admin")
  }

  // Get all admins (will be fetched client-side with proper vendor info)
  return <AdminManagement initialAdmins={[]} />
}
