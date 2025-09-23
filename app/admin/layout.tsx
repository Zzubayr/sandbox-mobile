import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-utils"
import { AdminLayout } from "@/components/admin/admin-layout"

export default async function AdminLayoutWrapper({
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

  // Check if user is admin
  const userIsAdmin = await isAdmin(user.id)
  if (!userIsAdmin) {
    redirect("/dashboard") // Redirect to regular dashboard
  }

  return (
    <AdminLayout userEmail={user.email}>
      {children}
    </AdminLayout>
  )
}
