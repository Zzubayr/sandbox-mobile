import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <DashboardLayout userEmail={user.email} vendor={vendor}>
      {children}
    </DashboardLayout>
  )
}
