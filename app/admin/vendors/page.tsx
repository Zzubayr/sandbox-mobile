import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getAllVendors } from "@/lib/admin-utils"
import { VendorManagement } from "@/components/admin/vendor-management"

export default async function AdminVendorsPage() {
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

  // Get all vendors
  const vendors = await getAllVendors()

  return <VendorManagement initialVendors={vendors} />
}
