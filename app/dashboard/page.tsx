import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardContent from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get vendor info
  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).single()

  if (!vendor) {
    redirect("/auth/login")
  }

  if (!vendor.whatsapp_number || !vendor.store_name) {
    redirect("/onboarding")
  }

  return <DashboardContent />
}
