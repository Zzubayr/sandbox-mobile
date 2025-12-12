"use client"

import { useState } from "react"
import { toastHelpers } from "@/lib/toast-helpers"
import { generateProductPoster } from "@/lib/poster-generator"
import { toImageUrl } from "@/lib/image-utils"
import type { Product, Vendor } from "@/lib/types"

interface UseProductShareProps {
  product: Product | null
  vendor: Vendor | null
}

export function useProductShare({ product, vendor }: UseProductShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [posterFile, setPosterFile] = useState<File | null>(null)

  const getShareUrl = () => {
    if (typeof window === "undefined") return ""
    if (!product || !vendor) return ""
    return `${window.location.origin}/store/${vendor.store_slug}/product/${product.id}`
  }

  const ensurePosterFile = async () => {
    if (!product || !vendor) return null
    if (posterFile) return posterFile

    setIsGenerating(true)
    try {
      const productImageUrl =
        product.images && product.images.length > 0
          ? toImageUrl(product.images[0] as any) || ""
          : ""

      if (!productImageUrl) {
        throw new Error("No product image available")
      }

      const blob = await generateProductPoster({
        productImage: productImageUrl,
        productTitle: product.title,
        productDescription: product.description || "",
        businessName: vendor.store_name,
        logoUrl: "/logo.png",
      })

      const file = new File([blob], `${product.title || "product"}.png`, { type: "image/png" })
      setPosterFile(file)
      return file
    } finally {
      setIsGenerating(false)
    }
  }

  const shareLink = async () => {
    if (!product || !vendor) {
      toastHelpers.saveError("Product is not ready to share yet")
      return
    }
    const url = getShareUrl()
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.description || "",
          url,
        })
        return
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(url)
      toastHelpers.success("Link copied")
    } catch {
      toastHelpers.saveError("Could not share link")
    }
  }

  const shareImage = async () => {
    if (typeof window === "undefined") return
    if (!product || !vendor) {
      toastHelpers.saveError("Product is not ready to share yet")
      return
    }
    const file = posterFile || (await ensurePosterFile())
    if (!file) {
      toastHelpers.saveError("Could not prepare image to share")
      return
    }
    setIsSharing(true)

    try {
      const productUrl = getShareUrl()

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: product.title,
          text: `${product.description || product.title}\n\n${productUrl}`,
        })
      } else if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: `${product.description || product.title}\n\n${productUrl}`,
          url: productUrl,
        })
      } else {
        const blobUrl = URL.createObjectURL(file)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = `${product.title || "product"}.png`
        link.style.display = "none"
        document.body.appendChild(link)
        link.click()
        link.remove()

        // As an extra fallback for environments that block downloads (e.g., some in-app browsers),
        // open the image in a new tab so the user can save/share manually.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000)

        try {
          await navigator.clipboard.writeText(productUrl)
          toastHelpers.success("Image downloaded • Link copied")
        } catch {
          toastHelpers.success("Image downloaded for sharing")
        }

        if (typeof window !== "undefined" && !navigator.share) {
          window.open(blobUrl, "_blank", "noopener,noreferrer")
        }
      }
    } catch (err) {
      console.error("Share image error:", err)
      toastHelpers.saveError(err instanceof Error ? err.message : "Could not share image")
    } finally {
      setIsSharing(false)
    }
  }

  return {
    shareLink,
    shareImage,
    isSharing,
    isGenerating,
  }
}
