import { redirect } from "next/navigation"
import AnalyticsPage from "@/components/dashboard/analytics-page"
import { requireUser } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"

export default async function AnalyticsPageWrapper() {
  try {
    const { user } = await requireUser()
    await connectToDatabase()
    const vendor = await Vendor.findOne({ user_id: user.id }).lean()
    if (!vendor) redirect('/onboarding')
    return <AnalyticsPage />
  } catch {
    redirect('/auth/login?next=/dashboard/analytics')
  }
}
