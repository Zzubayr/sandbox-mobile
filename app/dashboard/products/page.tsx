import { redirect } from "next/navigation"
import ProductsPage from "@/components/dashboard/products-page"
import { requireUser } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"

export default async function ProductsPageWrapper() {
  try {
    const { user } = await requireUser()
    await connectToDatabase()
    const vendor = await Vendor.findOne({ user_id: user.id }).lean()
    if (!vendor) redirect('/onboarding')
    return <ProductsPage />
  } catch {
    redirect('/auth/login?next=/dashboard/products')
  }
}
