"use client"

import Image from "next/image"
import { useState, memo } from "react"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { cn } from "@/lib/utils"

interface CloudinaryImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  quality?: string | number
  crop?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  placeholder?: "blur" | "empty"
  blurDataURL?: string
}

export const CloudinaryImage = memo(function CloudinaryImage({
  src,
  alt,
  width,
  height,
  className,
  quality = "auto",
  crop = "fill",
  fill = false,
  sizes,
  priority = false,
  placeholder = "blur",
  blurDataURL,
  ...props
}: CloudinaryImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Disable all Cloudinary transformations; use raw src directly
  const optimizedSrc = src

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-slate-100 text-slate-400",
          fill ? "w-full h-full" : "",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Image unavailable</div>
        </div>
      </div>
    )
  }

  // Always use Next/Image (works with data: and http/https when unoptimized)

  return (
    <div className={cn("relative", className)}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        // Disable Next.js image processing
        unoptimized
        // Remove blur processing by default unless a blurDataURL is explicitly provided
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300 object-cover",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        quality={typeof quality === "string" ? undefined : quality}
        {...props}
      />
      
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse",
            fill ? "w-full h-full" : ""
          )}
          style={!fill ? { width, height } : undefined}
        >
          <div className="text-slate-400">Loading...</div>
        </div>
      )}
    </div>
  )
})
