import type { Metadata } from "next"
import { headers } from "next/headers"
import { ReactNode } from "react"
import { connectToDatabase } from "@/lib/db/connection"
import Product from "@/lib/db/models/product"
import Vendor from "@/lib/db/models/vendor"
import { toImageUrl } from "@/lib/image-utils"

type LayoutProps = {
  children: ReactNode
  params: Promise<{ slug: string; productId: string }>
}

function buildAbsoluteUrl(pathOrUrl: string | undefined, baseUrl: string) {
  if (!pathOrUrl) return ""
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl
  if (pathOrUrl.startsWith("//")) return `https:${pathOrUrl}`
  if (pathOrUrl.startsWith("/")) return `${baseUrl}${pathOrUrl}`
  return `${baseUrl}/${pathOrUrl}`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productId: string }> }): Promise<Metadata> {
  const { slug, productId } = await params
  const host = headers().get("host") || process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000"
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https"
  const baseUrl = `${protocol}://${host}`

  await connectToDatabase()

  const vendorDoc = await Vendor.findOne({ store_slug: slug }).lean()
  if (!vendorDoc) {
    return {
      title: "Product not found - Ummah Square",
      description: "This product is unavailable.",
    }
  }

  const productDoc = await Product.findOne({ _id: productId, vendor_id: vendorDoc._id }).lean()
  if (!productDoc) {
    return {
      title: `${vendorDoc.store_name || "Store"} - Ummah Square`,
      description: vendorDoc.description || "Browse products on Ummah Square.",
      openGraph: {
        title: vendorDoc.store_name || "Ummah Square",
        description: vendorDoc.description || "Browse products on Ummah Square.",
        url: `${baseUrl}/store/${slug}`,
      },
    }
  }

  const product = {
    ...productDoc,
    id: (productDoc as any)._id?.toString?.(),
  } as any

  const vendor = {
    ...vendorDoc,
    id: (vendorDoc as any)._id?.toString?.(),
  } as any

  const imageCandidate = Array.isArray(product.images) && product.images.length > 0
    ? toImageUrl(product.images[0] as any)
    : vendor.banner_url || vendor.logo_url || "/logo.png"

  const imageUrl = buildAbsoluteUrl(imageCandidate, baseUrl)
  const title = product.title || vendor.store_name || "Ummah Square"
  const description = product.description || vendor.description || "Check out this product on Ummah Square."
  const pageUrl = `${baseUrl}/store/${slug}/product/${product.id || productId}`
  const siteName = vendor.store_name || "Ummah Square"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${product.title || "Product"} - ${siteName}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default function ProductLayout({ children }: LayoutProps) {
  return children
}
