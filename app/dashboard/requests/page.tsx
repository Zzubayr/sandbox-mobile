import { redirect } from "next/navigation"
import RequestsPage from "@/components/dashboard/requests-page"
import { requireUser } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"

export default async function RequestsPageWrapper() {
  try {
    const { user } = await requireUser()
    await connectToDatabase()
    const vendor = await Vendor.findOne({ user_id: user.id }).lean()
    if (!vendor) redirect('/onboarding')
    return <RequestsPage />
  } catch {
    redirect('/auth/login?next=/dashboard/requests')
  }
}
