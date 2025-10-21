import { redirect } from "next/navigation"
import DashboardContent from "@/components/dashboard/dashboard-content"
import { requireUser } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"

export default async function DashboardPage() {
  try {
    const { user } = await requireUser()
    await connectToDatabase()
    const vendor = await Vendor.findOne({ user_id: user.id }).lean()
    if (!vendor) redirect('/onboarding')
    if (!vendor.whatsapp_number || !vendor.store_name) redirect('/onboarding')
    return <DashboardContent />
  } catch {
    redirect('/auth/login?next=/dashboard')
  }
}
