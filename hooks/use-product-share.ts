"use client"

import { useEffect, useState } from "react"
import { toastHelpers } from "@/lib/toast-helpers"
import { generateProductPoster } from "@/lib/poster-generator"
import { toImageUrl } from "@/lib/image-utils"
import type { Product, Vendor } from "@/lib/types"

interface UseProductShareProps {
  product: Product
  vendor: Vendor
}

export function useProductShare({ product, vendor }: UseProductShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [posterFile, setPosterFile] = useState<File | null>(null)

  const getShareUrl = () => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/store/${vendor.store_slug}/product/${product.id}`
  }

  // Pre-generate poster so share stays within user gesture
  useEffect(() => {
    if (typeof window === "undefined" || !product || !vendor) {
      setPosterFile(null)
      return
    }

    let cancelled = false
    const prepare = async () => {
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

        if (cancelled) return
        setPosterFile(new File([blob], `${product.title || "product"}.png`, { type: "image/png" }))
      } catch (err) {
        if (!cancelled) {
          console.error("Prepare share image error:", err)
          setPosterFile(null)
        }
      } finally {
        if (!cancelled) setIsGenerating(false)
      }
    }

    prepare()
    return () => {
      cancelled = true
    }
  }, [product, vendor])

  const shareLink = async () => {
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
    if (!posterFile) {
      toastHelpers.saveError("Preparing image, please try again in a moment")
      return
    }

    setIsSharing(true)

    try {
      const productUrl = getShareUrl()

      if (navigator.canShare && navigator.canShare({ files: [posterFile] })) {
        await navigator.share({
          files: [posterFile],
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
        const link = document.createElement("a")
        link.href = URL.createObjectURL(posterFile)
        link.download = `${product.title || "product"}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)

        try {
          await navigator.clipboard.writeText(productUrl)
          toastHelpers.success("Image downloaded • Link copied")
        } catch {
          toastHelpers.success("Image downloaded for sharing")
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
