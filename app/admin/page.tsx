import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getVendorStats } from "@/lib/admin-utils"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
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

  // Get vendor statistics
  const stats = await getVendorStats()

  return <AdminDashboard initialStats={stats} />
}
