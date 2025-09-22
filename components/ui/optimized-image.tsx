"use client"

import { useState, useEffect, memo } from "react"
import { CloudinaryImage } from "./cloudinary-image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  fallback?: React.ReactNode
  blurDataURL?: string
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  fallback,
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Priority images are immediately in view

  useEffect(() => {
    if (priority) return // Priority images load immediately

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before the image comes into view
        threshold: 0.1,
      }
    )

    const element = document.getElementById(`image-${src}`)
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [src, priority])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-slate-100 text-slate-400",
          className
        )}
        style={{ width, height }}
      >
        {fallback || (
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Image unavailable</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      id={`image-${src}`}
      className={cn("relative", className)}
      style={{ width, height }}
    >
      {isInView ? (
        <CloudinaryImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full"
          priority={priority}
          placeholder="blur"
          blurDataURL={blurDataURL}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  )
})
