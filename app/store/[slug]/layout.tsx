import type React from "react"
import type { Metadata } from "next"
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    await connectToDatabase()
    const vendorDoc = await Vendor.findOne({ store_slug: params.slug, is_active: true }).lean()
    if (!vendorDoc) {
      return {
        title: "Storefront — Ummah Square",
        description: "Explore vendors on Ummah Square.",
      }
    }
    const title = vendorDoc.store_name || "Storefront"
    const description = vendorDoc.description || `Browse products from ${title}`
    const image = vendorDoc.banner_url || vendorDoc.logo_url || undefined
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || ""
    const url = base ? `${base.replace(/\/$/, "")}/store/${params.slug}` : undefined

    return {
      title: `${title} — Ummah Square`,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "Ummah Square",
        type: "website",
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {
      title: "Storefront — Ummah Square",
      description: "Explore vendors on Ummah Square.",
    }
  }
}
