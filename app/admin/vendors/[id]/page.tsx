import { redirect } from "next/navigation"
import { VendorDetailPage } from "@/components/admin/vendor-detail-page"
import { requireAdmin } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"
import Product from "@/lib/db/models/product"
import Request from "@/lib/db/models/request"

export default async function AdminVendorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  try {
    await requireAdmin()
  } catch {
    redirect('/auth/login?next=/admin/vendors')
  }

  await connectToDatabase()
  const vendorDoc = await Vendor.findById(params.id).lean()
  if (!vendorDoc) redirect('/admin/vendors')

  const [productsDocs, requestsDocs] = await Promise.all([
    Product.find({ vendor_id: vendorDoc._id }).sort({ created_at: -1 }).lean(),
    Request.find({ vendor_id: vendorDoc._id }).sort({ created_at: -1 }).lean(),
  ])

  const shape = (d: any) => ({ ...d, id: d?._id?.toString(), _id: undefined })
  const vendor = shape(vendorDoc)
  const products = productsDocs.map(shape)
  const requests = requestsDocs.map(shape)

  return <VendorDetailPage vendor={vendor as any} products={products as any} requests={requests as any} />
}
