import type React from "react"
import { redirect } from "next/navigation"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"
import StoreLayout from "@/components/storefront/store-layout"

function shapeId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any
  const { _id, ...rest } = doc as any
  return { ...rest, id: _id?.toString?.() }
}

export default async function StoreLayoutWrapper({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  await connectToDatabase()
  const vendorDoc = await Vendor.findOne({ store_slug: params.slug, is_active: true }).lean()
  if (!vendorDoc) redirect("/")
  const vendor = shapeId(vendorDoc)

  return (
    <StoreLayout vendor={vendor}>
      {children}
    </StoreLayout>
  )
}
