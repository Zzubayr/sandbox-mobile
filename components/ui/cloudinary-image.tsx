"use client"

import Image from "next/image"
import { useState } from "react"
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

export function CloudinaryImage({
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
  placeholder = "empty",
  blurDataURL,
  ...props
}: CloudinaryImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Check if it's a Cloudinary URL or data URL
  const isCloudinaryUrl = src.includes('cloudinary.com')
  const isDataUrl = src.startsWith('data:')
  
  // Generate optimized URL if it's from Cloudinary
  const optimizedSrc = isCloudinaryUrl 
    ? getOptimizedImageUrl(src, {
        width: fill ? undefined : width,
        height: fill ? undefined : height,
        quality,
        crop,
      })
    : src

  // Generate blur placeholder for Cloudinary images
  const generateBlurDataURL = (url: string) => {
    if (!isCloudinaryUrl || isDataUrl) return blurDataURL
    
    // Create a very low quality, small version for blur placeholder
    const blurUrl = getOptimizedImageUrl(url, {
      width: 20,
      height: 20,
      quality: 1,
      crop: "fill",
    })
    
    return blurUrl
  }

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

  // For data URLs, use regular img tag instead of Next.js Image
  if (isDataUrl) {
    return (
      <div className={cn("relative", className)}>
        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={cn(
            "transition-opacity duration-300 object-cover",
            isLoading ? "opacity-0" : "opacity-100",
            fill ? "w-full h-full" : "",
            className
          )}
          style={fill ? { width: '100%', height: '100%' } : { width, height }}
          onLoad={handleLoad}
          onError={handleError}
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
  }

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
        placeholder={placeholder}
        blurDataURL={blurDataURL || (placeholder === "blur" ? generateBlurDataURL(src) : undefined)}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
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
}
