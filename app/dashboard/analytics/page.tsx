import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AnalyticsPage from "@/components/dashboard/analytics-page"

export default async function AnalyticsPageWrapper() {
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

  return <AnalyticsPage />
}
