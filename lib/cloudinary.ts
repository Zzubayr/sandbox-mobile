// Client-side helper functions for Cloudinary operations

// Helper function to upload image via API route
export async function uploadImage(file: File, folder: string = 'sandbox'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload image')
  }

  const data = await response.json()
  
  // Log info about upload type
  if (data.isMock) {
    console.log('📷 Using mock image for development')
  } else if (data.url.startsWith('data:')) {
    console.log('🖼️ Image uploaded as data URL for preview')
  } else {
    console.log('☁️ Image uploaded to Cloudinary successfully')
  }
  
  return data.url
}

// Helper function to delete image via API route
export async function deleteImage(publicId: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete image')
  }
}

// Helper function to get optimized image URL
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
  } = {}
): string {
  // If it's not a Cloudinary URL, return as is
  if (!url.includes('cloudinary.com')) {
    return url
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options

  // Extract public ID from Cloudinary URL
  const publicId = extractPublicId(url)
  if (!publicId) {
    return url
  }

  // Build optimized URL manually
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    // If cloud name is not available, return original URL
    return url
  }
  
  let optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload`
  
  // Add transformations in optimal order for better compression
  const transformations = []
  
  // Quality first for better compression
  if (quality) transformations.push(`q_${quality}`)
  
  // Format for modern browsers
  if (format) transformations.push(`f_${format}`)
  
  // Crop mode
  if (crop) transformations.push(`c_${crop}`)
  
  // Dimensions
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  
  // Add optimization flags
  transformations.push('fl_progressive') // Progressive JPEG
  transformations.push('fl_immutable_cache') // Cache optimization
  
  if (transformations.length > 0) {
    optimizedUrl += `/${transformations.join(',')}`
  }
  
  optimizedUrl += `/${publicId}`
  
  return optimizedUrl
}

// Helper function to extract public ID from Cloudinary URL
export function extractPublicId(url: string): string | null {
  const regex = /\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i
  const match = url.match(regex)
  return match ? match[1] : null
}
