"use client"

import { useState } from "react"
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

    const getShareUrl = () => {
        if (typeof window === "undefined") return ""
        return `${window.location.origin}/store/${vendor.store_slug}/product/${product.id}`
    }

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
        } catch { }

        try {
            await navigator.clipboard.writeText(url)
            toastHelpers.success("Link copied")
        } catch {
            toastHelpers.saveError("Could not share link")
        }
    }

    const shareImage = async () => {
        if (typeof window === "undefined") return

        setIsGenerating(true)
        setIsSharing(true)

        try {
            const productImageUrl = product.images && product.images.length > 0
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
            const productUrl = getShareUrl()

            // Try native sharing first
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: product.title,
                    text: `${product.description || product.title}\n\n${productUrl}`,
                })
            } else if (navigator.share) {
                // Fallback for browsers that support share but maybe not files (or if canShare returns false)
                await navigator.share({
                    title: product.title,
                    text: `${product.description || product.title}\n\n${productUrl}`,
                    url: productUrl,
                })
            } else {
                // Fallback to download
                const link = document.createElement("a")
                link.href = URL.createObjectURL(file)
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
            setIsGenerating(false)
            setIsSharing(false)
        }
    }

    return {
        shareLink,
        shareImage,
        isSharing,
        isGenerating
    }
}
